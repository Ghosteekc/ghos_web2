import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("условия выбранного тарифа видны до кнопки открытия счёта", async () => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { ProPlanPicker } = await vite.ssrLoadModule("/src/components/pro/ProPlanPicker.tsx");
    const html = renderToStaticMarkup(createElement(ProPlanPicker, {
      plans: [{ id: "test_plan", title: "Тестовый тариф", description: "", stars: 100, stars_to_pay: 75, months: 1 }],
      selectedId: "test_plan",
      onSelect: () => {},
      onBuy: () => {},
      paying: null,
      isPro: false,
    }));
    const disclosure = html.indexOf("Условия покупки Ghosteek Pro");
    const checkout = html.indexOf("Получить Ghosteek Pro");
    assert.ok(disclosure >= 0 && checkout > disclosure);
    assert.match(html, /К оплате сейчас:/);
    assert.match(html, /75 Stars \(XTR\)/);
    assert.match(html, /Срок выбранного тарифа:/);
    assert.match(html, /1 месяц/);
    assert.match(html, /Разовый платёж внутри Telegram/);
    assert.match(html, /\/paysupport/);
  } finally {
    await vite.close();
    delete globalThis.localStorage;
  }
});
