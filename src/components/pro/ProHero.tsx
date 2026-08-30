import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/utils";
import { PRO_TITLE, daysLeftWord, formatProExpiry } from "./proFeatures";

interface ProHeroProps {
  isPro: boolean;
  isTrial?: boolean;
  expired: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
  onGetPro?: () => void;
}

export function ProHero({
  isPro,
  isTrial = false,
  expired,
  expiresAt,
  daysLeft,
  onGetPro,
}: ProHeroProps) {
  const until = formatProExpiry(expiresAt);

  return (
    <section className="pro-hero glass-card ui-enter" aria-label={PRO_TITLE}>
      <div className="pro-hero__glow pointer-events-none" aria-hidden />
      <div className="relative z-[1] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="pro-hero__eyebrow">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden />
              {PRO_TITLE.toUpperCase()}
            </p>
            {isPro ? (
              <>
                <h2 className="pro-hero__title">
                  {isTrial ? "Пробный период активен" : "Подписка активна"}
                </h2>
                <p className="pro-hero__subtitle text-cr-gold">
                  {daysLeft != null && daysLeft > 0 ? (
                    <>
                      Осталось {daysLeft} {daysLeftWord(daysLeft)}
                      {until ? ` · до ${until}` : ""}
                    </>
                  ) : until ? (
                    `Действует до ${until}`
                  ) : (
                    "Без ограничения по сроку"
                  )}
                </p>
              </>
            ) : (
              <>
                <h2 className="pro-hero__title">Играй умнее.</h2>
                <p className="pro-hero__title pro-hero__title--second">Анализируй больше.</p>
                <p className="pro-hero__subtitle">
                  {expired && until
                    ? `Подписка закончилась ${until}. Продли доступ к премиальным инструментам.`
                    : "Полный доступ к премиальным инструментам Ghosteek для Clash Royale."}
                </p>
              </>
            )}
          </div>
          <div
            className={cn(
              "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border",
              isPro
                ? "bg-cr-gold/20 border-cr-gold/45 shadow-glow"
                : "bg-cr-blue/10 border-cr-blue/25",
            )}
            aria-hidden
          >
            <Crown className={cn("w-5 h-5", isPro ? "text-cr-gold" : "text-cr-blue")} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="pro-hero__pill">5 Pro-функций</span>
          {isPro ? (
            <>
              {isTrial ? (
                <span className="pro-hero__pill pro-hero__pill--trial">Пробный Pro</span>
              ) : null}
              <span className="pro-hero__pill pro-hero__pill--active">Pro активен</span>
            </>
          ) : null}
        </div>

        {!isPro && onGetPro ? (
          <Button variant="primary" className="w-full !py-2.5 text-base mt-1" onClick={onGetPro}>
            Получить Pro
          </Button>
        ) : isPro ? (
          <p className="text-xs text-cr-muted leading-snug">
            {isTrial
              ? "После пробного периода оформи подписку ниже, чтобы сохранить доступ."
              : "Любая покупка ниже продлевает подписку с текущей даты окончания."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
