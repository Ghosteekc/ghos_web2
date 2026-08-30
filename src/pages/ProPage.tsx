import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, Card, ErrorState, Loader, PageHeader } from "@/components/ui";
import { PRO_TITLE, ProCreditsCard, ProFeatureShowcase, ProHero, ProPlanPicker, ProReferralCard, ProTrialOffer } from "@/components/pro";
import { useGhosteekPro } from "@/hooks/useGhosteekPro";
import { usePageRefresh } from "@/hooks";
import { api, ApiError } from "@/api/client";
import { haptic } from "@/utils/hapticManager";
import type { ProPlan } from "@/types";

function defaultPlanId(plans: ProPlan[]): string | null {
  if (!plans.length) return null;
  return plans.find((p) => p.badge)?.id ?? plans[0].id;
}

export function ProPage() {
  const navigate = useNavigate();
  const plansRef = useRef<HTMLDivElement>(null);
  const {
    isPro,
    isTrial,
    expired,
    expiresAt,
    daysLeft,
    trialAvailable,
    trialDays,
    plans,
    referralDiscountActive,
    referralDiscountExpiresAt,
    creditsBalance,
    creditsMaxSharePercent,
    loading,
    error,
    refresh,
  } = useGhosteekPro();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const activePlanId = useMemo(() => {
    if (selectedId && plans.some((p) => p.id === selectedId)) return selectedId;
    return defaultPlanId(plans);
  }, [plans, selectedId]);

  usePageRefresh(refresh);

  const scrollToPlans = useCallback(() => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const startTrial = useCallback(async () => {
    if (trialLoading || paying) return;
    setTrialLoading(true);
    setPayError(null);
    setNotice(null);
    try {
      const res = await api.startProTrial();
      if (res.activated) {
        haptic.heavy();
        setNotice(res.message);
        await refresh();
      } else {
        setPayError(res.message);
      }
    } catch (e) {
      setPayError(e instanceof ApiError ? e.message : "Не удалось активировать пробный период.");
    } finally {
      setTrialLoading(false);
    }
  }, [trialLoading, paying, refresh]);

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
            "Оплата Telegram Stars доступна только внутри Telegram. Открой приложение из бота.",
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
            setPayError("Платёж не прошёл. Попробуй ещё раз.");
          }
        });
      } catch (e) {
        setPayError(
          e instanceof ApiError ? e.message : "Не удалось создать счёт. Попробуй позже.",
        );
        setPaying(null);
      }
    },
    [paying, refresh],
  );

  if (loading && !plans.length) return <Loader />;

  return (
    <div className="space-y-5 pb-2">
      <PageHeader
        title={PRO_TITLE}
        action={
          <Button variant="ghost" onClick={() => navigate(-1)} className="!p-2" aria-label="Назад">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      {error ? <ErrorState title={error} button="Повторить" onAction={() => void refresh()} /> : null}

      <ProHero
        isPro={isPro}
        isTrial={isTrial}
        expired={expired}
        expiresAt={expiresAt}
        daysLeft={daysLeft}
        onGetPro={scrollToPlans}
      />

      {trialAvailable ? (
        <ProTrialOffer trialDays={trialDays} loading={trialLoading} onStart={() => void startTrial()} />
      ) : null}

      {notice ? (
        <Card className="!py-2 text-center text-sm text-cr-win ui-enter">{notice}</Card>
      ) : null}
      {payError ? (
        <Card className="!py-2 text-center text-sm text-cr-loss ui-enter">{payError}</Card>
      ) : null}

      <ProFeatureShowcase />

      <ProCreditsCard balance={creditsBalance} maxSharePercent={creditsMaxSharePercent} />

      <ProReferralCard />

      <div ref={plansRef}>
        <ProPlanPicker
          plans={plans}
          selectedId={activePlanId}
          onSelect={setSelectedId}
          onBuy={(plan) => void buy(plan)}
          paying={paying}
          isPro={isPro}
          referralDiscountActive={referralDiscountActive}
          referralDiscountExpiresAt={referralDiscountExpiresAt}
        />
      </div>
    </div>
  );
}

export { ProPage as default };
