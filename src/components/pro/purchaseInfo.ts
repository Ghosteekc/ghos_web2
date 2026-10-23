import type { ProPlan } from "@/types";

function monthsWord(months: number): string {
  if (months % 100 >= 11 && months % 100 <= 14) return "месяцев";
  if (months % 10 === 1) return "месяц";
  if (months % 10 >= 2 && months % 10 <= 4) return "месяца";
  return "месяцев";
}

export function purchaseInfo(plan: Pick<ProPlan, "months" | "stars" | "stars_to_pay">) {
  return {
    stars: plan.stars_to_pay ?? plan.stars,
    duration: `${plan.months} ${monthsWord(plan.months)}`,
  };
}

export function approvedLegalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function invoiceOutcome(status: "paid" | "cancelled" | "failed" | "pending") {
  if (status === "paid") return { notice: "Оплата прошла. Активируем Ghosteek Pro…", error: null, refresh: true };
  if (status === "pending") return { notice: "Платёж обрабатывается. Статус обновится автоматически.", error: null, refresh: true };
  if (status === "failed") return { notice: null, error: "Платёж не прошёл. Попробуй ещё раз.", refresh: false };
  return { notice: null, error: null, refresh: false };
}
