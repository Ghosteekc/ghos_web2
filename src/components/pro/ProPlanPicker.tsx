import { useMemo } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/utils";
import { internalPressableProps } from "@/utils/nativeCallout";
import type { ProPlan } from "@/types";
import { ProStarPrice } from "./ProStarPrice";

function monthsWord(n: number): string {
  if (n === 1) return "месяц";
  if (n >= 2 && n <= 4) return "месяца";
  return "месяцев";
}

function pricePerMonth(plan: ProPlan): number {
  const pay = plan.stars_to_pay ?? plan.stars;
  if (plan.months <= 0) return pay;
  return Math.round(pay / plan.months);
}

function formatDiscountUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

interface ProPlanPickerProps {
  plans: ProPlan[];
  selectedId: string | null;
  onSelect: (planId: string) => void;
  onBuy: (plan: ProPlan) => void;
  paying: string | null;
  isPro: boolean;
  referralDiscountActive?: boolean;
  referralDiscountExpiresAt?: string | null;
}

export function ProPlanPicker({
  plans,
  selectedId,
  onSelect,
  onBuy,
  paying,
  isPro,
  referralDiscountActive = false,
  referralDiscountExpiresAt = null,
}: ProPlanPickerProps) {
  const selected = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? plans[0] ?? null,
    [plans, selectedId],
  );

  const untilLabel = formatDiscountUntil(referralDiscountExpiresAt);

  if (!plans.length) return null;

  return (
    <section className="space-y-3" aria-labelledby="pro-plans-heading">
      <h2 id="pro-plans-heading" className="text-base font-semibold text-cr-text">
        {isPro ? "Продлить подписку" : "Оплата"}
      </h2>

      {referralDiscountActive ? (
        <p className="text-sm text-cr-gold leading-snug">
          Скидка по приглашению
          {untilLabel ? <> действует до {untilLabel}</> : null}.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Тариф Ghosteek Pro">
        {plans.map((plan, i) => {
          const isSelected = plan.id === selectedId;
          const pay = plan.stars_to_pay ?? plan.stars;
          const perMonth = pricePerMonth(plan);
          const original = plan.original_stars ?? null;
          const hasDiscount = original != null && original > pay;

          return (
            <button
              key={plan.id}
              type="button"
              disabled={paying !== null}
              aria-pressed={isSelected}
              onClick={() => onSelect(plan.id)}
              className={cn(
                "pixel-btn pixel-bevel pixel-btn--nav-row pro-plan-btn ui-enter w-full",
                isSelected && "pixel-btn--active",
              )}
              style={{ animationDelay: `${Math.min(i, 4) * 40}ms` }}
              {...internalPressableProps}
            >
              <span className="pixel-btn-icon-slot" aria-hidden>
                {isSelected ? (
                  <Check className="pixel-btn-icon" strokeWidth={2.5} />
                ) : (
                  <Star className="pixel-btn-icon" strokeWidth={2.25} />
                )}
              </span>

              <span className="pixel-btn-text pro-plan-btn__text">
                <span className="pixel-btn-label pro-plan-btn__title">
                  <span>{plan.title}</span>
                  {plan.badge ? <span className="pro-plan-btn__badge">{plan.badge}</span> : null}
                </span>

                <span className="pro-plan-btn__price">
                  <ProStarPrice
                    stars={pay}
                    size="lg"
                    tone={isSelected ? "inherit" : "accent"}
                    className="!text-xl"
                  />
                  {hasDiscount ? (
                    <span className="pro-plan-btn__was tabular-nums">{original} ★</span>
                  ) : null}
                </span>

                <span className="pixel-btn-hint pro-plan-btn__hint tabular-nums">
                  {plan.months === 1 ? (
                    <>
                      {pay} ★ / месяц
                    </>
                  ) : (
                    <>
                      ≈ {perMonth} ★ / месяц · {plan.months} {monthsWord(plan.months)}
                    </>
                  )}
                </span>
              </span>

            </button>
          );
        })}
      </div>

      {selected ? (
        <Card className="!p-3 ui-enter space-y-3" delay={0.12}>
          <CheckoutBreakdown plan={selected} />
          <Button
            variant="primary"
            className="pro-plan-cta w-full !py-3 text-base flex items-center justify-center gap-2"
            disabled={paying !== null}
            onClick={() => onBuy(selected)}
          >
            {paying === selected.id ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                Открываем счёт…
              </>
            ) : (
              <>
                {isPro ? "Продлить Ghosteek Pro" : "Получить Ghosteek Pro"}
                <span className="opacity-80" aria-hidden>
                  ·
                </span>
                <ProStarPrice
                  stars={selected.stars_to_pay ?? selected.stars}
                  size="md"
                  tone="inherit"
                  className="!text-base opacity-95"
                />
              </>
            )}
          </Button>
        </Card>
      ) : null}

      <p className="text-xs text-cr-muted leading-snug">
        Оплата проходит внутри Telegram через Stars (XTR). Подписка продлевается вручную —
        автосписаний нет. Credits покрывают не больше половины стоимости.
      </p>
    </section>
  );
}

function CheckoutBreakdown({ plan }: { plan: ProPlan }) {
  const base = plan.original_stars ?? plan.final_price ?? plan.stars;
  const discountPct = plan.discount_percent ?? 0;
  const finalPrice = plan.final_price ?? plan.stars;
  const credits = plan.credits_to_use ?? 0;
  const pay = plan.stars_to_pay ?? plan.stars;
  const showDiscount = discountPct > 0 && (plan.original_stars ?? 0) > finalPrice;
  const showCredits = credits > 0;

  if (!showDiscount && !showCredits) return null;

  return (
    <div className="space-y-1.5 text-sm tabular-nums">
      <div className="flex justify-between gap-2 text-cr-muted">
        <span>Ghosteek Pro · {plan.title}</span>
        <span>{base} ★</span>
      </div>
      {showDiscount ? (
        <div className="flex justify-between gap-2 text-cr-gold">
          <span>− {discountPct}% скидка</span>
          <span>{finalPrice} ★</span>
        </div>
      ) : null}
      {showCredits ? (
        <div className="flex justify-between gap-2 text-cr-gold">
          <span>Credits</span>
          <span>− {credits}</span>
        </div>
      ) : null}
      <div className="flex justify-between gap-2 font-bold text-cr-text pt-1 border-t border-cr-border/40">
        <span>К оплате</span>
        <span>{pay} ★</span>
      </div>
    </div>
  );
}
