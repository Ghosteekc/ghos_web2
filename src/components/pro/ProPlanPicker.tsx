import { useMemo } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/utils";
import type { ProPlan } from "@/types";
import { ProStarPrice } from "./ProStarPrice";

function monthsWord(n: number): string {
  if (n === 1) return "месяц";
  if (n >= 2 && n <= 4) return "месяца";
  return "месяцев";
}

function pricePerMonth(plan: ProPlan): number {
  if (plan.months <= 0) return plan.stars;
  return Math.round(plan.stars / plan.months);
}

interface ProPlanPickerProps {
  plans: ProPlan[];
  selectedId: string | null;
  onSelect: (planId: string) => void;
  onBuy: (plan: ProPlan) => void;
  paying: string | null;
  isPro: boolean;
}

export function ProPlanPicker({
  plans,
  selectedId,
  onSelect,
  onBuy,
  paying,
  isPro,
}: ProPlanPickerProps) {
  const selected = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? plans[0] ?? null,
    [plans, selectedId],
  );

  if (!plans.length) return null;

  return (
    <section className="space-y-3" aria-labelledby="pro-plans-heading">
      <h2 id="pro-plans-heading" className="text-base font-semibold text-cr-text">
        {isPro ? "Продлить подписку" : "Выберите срок"}
      </h2>

      <div className="grid grid-cols-1 gap-2.5">
        {plans.map((plan, i) => {
          const isSelected = plan.id === selectedId;
          const perMonth = pricePerMonth(plan);

          return (
            <button
              key={plan.id}
              type="button"
              disabled={paying !== null}
              aria-pressed={isSelected}
              onClick={() => onSelect(plan.id)}
              className={cn(
                "pro-plan-card glass-card ui-enter text-left w-full",
                isSelected && "pro-plan-card--selected",
                plan.badge && !isSelected && "pro-plan-card--highlight",
              )}
              style={{ animationDelay: `${Math.min(i, 4) * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold uppercase tracking-wide text-cr-muted">
                  {plan.title}
                </p>
                {plan.badge ? (
                  <span className="pro-plan-card__badge">{plan.badge}</span>
                ) : null}
              </div>

              <ProStarPrice stars={plan.stars} size="xl" className="mt-2" />

              <p className="text-xs text-cr-muted mt-1.5 tabular-nums">
                {plan.months === 1 ? (
                  <>
                    {plan.stars}{" "}
                    <StarInline />
                    {" / месяц"}
                  </>
                ) : (
                  <>
                    ≈ {perMonth} <StarInline /> / месяц · {plan.months} {monthsWord(plan.months)}
                  </>
                )}
              </p>

              {isSelected ? (
                <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-cr-gold">
                  <Check className="w-3.5 h-3.5" aria-hidden />
                  Выбрано
                </p>
              ) : (
                <p className="mt-2.5 text-xs text-cr-muted">Нажмите, чтобы выбрать</p>
              )}
            </button>
          );
        })}
      </div>

      {selected ? (
        <Card className="!p-3 ui-enter" delay={0.12}>
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
                <span className="opacity-90">·</span>
                <ProStarPrice stars={selected.stars} size="md" className="!text-base" />
              </>
            )}
          </Button>
        </Card>
      ) : null}

      <p className="text-xs text-cr-muted leading-snug">
        Оплата проходит внутри Telegram через Stars (XTR). Подписка продлевается вручную —
        автосписаний нет.
      </p>
    </section>
  );
}

function StarInline() {
  return (
    <span className="text-cr-gold font-bold" aria-hidden>
      ★
    </span>
  );
}
