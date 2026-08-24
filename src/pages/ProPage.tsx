import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Loader2, Sparkles } from "lucide-react";
import { Button, Card, ErrorState, Loader, PageHeader } from "@/components/ui";
import { PRO_FEATURES, PRO_TAGLINE, PRO_TITLE, daysLeftWord, formatProExpiry } from "@/components/pro";
import { useGhosteekPro } from "@/hooks/useGhosteekPro";
import { usePageRefresh } from "@/hooks";
import { api, ApiError } from "@/api/client";
import { cn } from "@/utils";
import { haptic } from "@/utils/hapticManager";
import type { ProPlan } from "@/types";

function monthsWord(n: number): string {
  if (n === 1) return "месяц";
  if (n >= 2 && n <= 4) return "месяца";
  return "месяцев";
}

function pricePerMonth(plan: ProPlan): string {
  if (plan.months <= 0) return `${plan.stars} ★`;
  return `${Math.round(plan.stars / plan.months)} ★ / мес`;
}

function StatusCard({
  isPro,
  expired,
  expiresAt,
  daysLeft,
}: {
  isPro: boolean;
  expired: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
}) {
  const until = formatProExpiry(expiresAt);

  if (isPro) {
    return (
      <Card className="border-cr-gold/40 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-cr-gold/20 border border-cr-gold/50 flex items-center justify-center">
            <Crown className="w-6 h-6 text-cr-gold" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-cr-text">{PRO_TITLE} активен</p>
            <p className="text-sm text-cr-gold">
              {daysLeft != null && daysLeft > 0
                ? `Осталось ${daysLeft} ${daysLeftWord(daysLeft)}${until ? ` · до ${until}` : ""}`
                : until
                  ? `Действует до ${until}`
                  : "Без ограничения по сроку"}
            </p>
            <p className="text-xs text-cr-muted mt-1">
              Любая покупка ниже продлевает подписку с текущей даты окончания.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={expired ? "border-cr-loss/30" : "border-cr-gold/20"}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-xl bg-cr-surface border border-cr-border flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-cr-muted" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-cr-text">
            {expired ? `${PRO_TITLE} истёк` : `${PRO_TITLE} не подключён`}
          </p>
          <p className={cn("text-sm", expired ? "text-cr-loss" : "text-cr-muted")}>
            {expired && until ? `Подписка закончилась ${until}` : PRO_TAGLINE}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ProPage() {
  const navigate = useNavigate();
  const { isPro, expired, expiresAt, daysLeft, plans, loading, error, refresh } = useGhosteekPro();
  const [paying, setPaying] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  usePageRefresh(refresh);

  const buy = useCallback(
    async (plan: ProPlan) => {
      if (paying) return;
      setPaying(plan.id);
      setPayError(null);
      setNotice(null);
      try {
        const invoice = await api.createProInvoice(plan.id);
        const webApp = window.Telegram?.WebApp;
        if (!webApp?.openInvoice) {
          setPayError(
            "Оплата Telegram Stars доступна только внутри Telegram. Откройте Mini App из бота.",
          );
          return;
        }
        webApp.openInvoice(invoice.invoice_link, (status) => {
          setPaying(null);
          if (status === "paid") {
            haptic.heavy();
            setNotice("Оплата прошла. Активируем Ghosteek Pro…");
            void refresh();
            return;
          }
          if (status === "pending") {
            setNotice("Платёж обрабатывается. Статус обновится автоматически.");
            void refresh();
            return;
          }
          if (status === "failed") {
            setPayError("Платёж не прошёл. Попробуйте ещё раз.");
          }
        });
      } catch (e) {
        setPayError(
          e instanceof ApiError ? e.message : "Не удалось создать счёт. Попробуйте позже.",
        );
        setPaying(null);
      }
    },
    [paying, refresh],
  );

  if (loading && !plans.length) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={PRO_TITLE}
        subtitle={PRO_TAGLINE}
        action={
          <Button variant="ghost" onClick={() => navigate(-1)} className="!p-2" aria-label="Назад">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      {error ? <ErrorState title={error} button="Повторить" onAction={() => void refresh()} /> : null}

      <StatusCard isPro={isPro} expired={expired} expiresAt={expiresAt} daysLeft={daysLeft} />

      {notice ? (
        <Card className="!py-2 text-center text-sm text-cr-win">{notice}</Card>
      ) : null}
      {payError ? (
        <Card className="!py-2 text-center text-sm text-cr-loss">{payError}</Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-cr-text">Что входит</h2>
        {PRO_FEATURES.map((feature, i) => (
          <Card key={feature.id} className="!p-3" delay={Math.min(i, 6) * 0.04}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-cr-gold/12 border border-cr-gold/25 flex items-center justify-center">
                <feature.icon className="w-4 h-4 text-cr-gold" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-cr-text">{feature.title}</p>
                <p className="text-sm text-cr-muted leading-snug mt-0.5">{feature.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-cr-text">
          {isPro ? "Продлить подписку" : "Выберите срок"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map((plan, i) => (
            <Card
              key={plan.id}
              delay={Math.min(i, 4) * 0.04}
              className={cn("!p-4 flex flex-col", plan.badge && "border-cr-gold/40")}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold text-cr-text">{plan.title}</p>
                {plan.badge ? (
                  <span className="px-2 py-0.5 rounded-full bg-cr-gold/15 border border-cr-gold/40 text-2xs font-bold uppercase tracking-wider text-cr-gold">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-extrabold text-cr-gold tabular-nums mt-2">
                {plan.stars} ★
              </p>
              <p className="text-xs text-cr-muted mt-0.5">
                {pricePerMonth(plan)} · {plan.months} {monthsWord(plan.months)}
              </p>
              <Button
                variant={plan.badge ? "primary" : "secondary"}
                className="!py-2 text-sm mt-3 w-full flex items-center justify-center gap-1.5"
                disabled={paying !== null}
                onClick={() => void buy(plan)}
              >
                {paying === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Счёт…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" aria-hidden />
                    {isPro ? "Продлить" : "Оплатить"}
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
        <p className="text-xs text-cr-muted leading-snug">
          Оплата проходит внутри Telegram через Stars (XTR). Подписка продлевается вручную —
          автосписаний нет.
        </p>
      </div>
    </div>
  );
}

export { ProPage as default };
