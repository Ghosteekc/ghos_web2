import assert from "node:assert/strict";
import { test } from "node:test";
import { approvedLegalUrl, invoiceOutcome, purchaseInfo } from "../src/components/pro/purchaseInfo.ts";

test("перед оплатой показываются цена и срок выбранного тарифа из API", () => {
  assert.deepEqual(purchaseInfo({ months: 1, stars: 100, stars_to_pay: 75 }), {
    stars: 75,
    duration: "1 месяц",
  });
  assert.deepEqual(purchaseInfo({ months: 3, stars: 250, stars_to_pay: null }), {
    stars: 250,
    duration: "3 месяца",
  });
  assert.equal(purchaseInfo({ months: 6, stars: 500, stars_to_pay: 500 }).duration, "6 месяцев");
});

test("юридические ссылки отсутствуют без утверждённого HTTPS-адреса", () => {
  assert.equal(approvedLegalUrl(undefined), null);
  assert.equal(approvedLegalUrl(""), null);
  assert.equal(approvedLegalUrl("javascript:alert(1)"), null);
  assert.equal(approvedLegalUrl("http://example.com/terms"), null);
  assert.equal(approvedLegalUrl("https://user:pass@example.com/terms"), null);
  assert.equal(approvedLegalUrl("https://example.com/terms"), "https://example.com/terms");
});

test("результаты счёта: оплата, ожидание, отмена и ошибка", () => {
  assert.deepEqual(invoiceOutcome("paid"), {
    notice: "Оплата прошла. Активируем Ghosteek Pro…", error: null, refresh: true,
  });
  assert.equal(invoiceOutcome("pending").refresh, true);
  assert.deepEqual(invoiceOutcome("cancelled"), { notice: null, error: null, refresh: false });
  assert.equal(invoiceOutcome("failed").error, "Платёж не прошёл. Попробуй ещё раз.");
});
