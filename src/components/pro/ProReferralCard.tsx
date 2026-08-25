import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import { Button, Card, Loader } from "@/components/ui";
import { api, ApiError } from "@/api/client";
import { usePageRefresh, useTelegram } from "@/hooks";
import { haptic } from "@/utils/hapticManager";
import type { ReferralStatus } from "@/types";
import { cn } from "@/utils";

function friendsWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "друзей";
  if (last === 1) return "друга";
  if (last >= 2 && last <= 4) return "друга";
  return "друзей";
}

export function ProReferralCard() {
  const { tg, openTelegramLink } = useTelegram();
  const [data, setData] = useState<ReferralStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.getReferralStatus());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить рефералку");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = useCallback(async () => {
    if (!data?.referral_link) return;
    try {
      await navigator.clipboard.writeText(data.referral_link);
      haptic.light();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Не удалось скопировать ссылку");
    }
  }, [data?.referral_link]);

  const inviteFriends = useCallback(() => {
    if (!data?.referral_link) return;
    haptic.medium();
    const text = encodeURIComponent(
      "Присоединяйся к Ghosteek — ассистенту для Clash Royale. Разбор боёв, мета и AI-тренер:",
    );
    const url = encodeURIComponent(data.referral_link);
    const sharePath = `share/url?url=${url}&text=${text}`;
    if (tg?.openTelegramLink) {
      openTelegramLink(sharePath);
      return;
    }
    window.open(`https://t.me/${sharePath}`, "_blank");
  }, [data?.referral_link, openTelegramLink, tg]);

  if (loading && !data) {
    return (
      <Card className="!p-4">
        <Loader />
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="!p-4">
        <p className="text-sm text-cr-loss text-center">{error}</p>
        <Button variant="secondary" className="w-full mt-3 !py-2" onClick={() => void load()}>
          Повторить
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  const { current_progress, required_referrals, next_reward_in, reward_days } = data;
  const justRewarded =
    data.successful_referrals > 0 &&
    current_progress === 0 &&
    data.rewards_earned > 0 &&
    data.successful_referrals % required_referrals === 0;

  let progressHint: string;
  if (justRewarded) {
    progressHint = `🎉 Ты пригласил ${required_referrals} друзей — тебе начислено +${reward_days} дней Ghosteek Pro!`;
  } else if (data.successful_referrals >= required_referrals) {
    progressHint = `Приглашено: ${data.successful_referrals} · Следующая награда: через ${next_reward_in} ${friendsWord(next_reward_in)}`;
  } else if (current_progress === 0) {
    progressHint = `${required_referrals} приглашённых друзей → +${reward_days} дней Pro`;
  } else {
    progressHint = `Ещё ${next_reward_in} ${friendsWord(next_reward_in)} → +${reward_days} дней Ghosteek Pro`;
  }

  const pct = Math.min(100, Math.round((current_progress / required_referrals) * 100));

  return (
    <section className="space-y-3" aria-labelledby="pro-referral-heading">
      <h2 id="pro-referral-heading" className="text-base font-semibold text-cr-text">
        Или бесплатно
      </h2>
      <Card className="pro-referral-card glass-card ui-enter !p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-cr-blue/15 border border-cr-blue/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-cr-blue" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-cr-text leading-tight">
              Приглашай друзей — получай Pro бесплатно
            </h3>
            <p className="text-sm text-cr-muted leading-snug mt-1">
              {required_referrals} новых друзей → +{reward_days} дней Ghosteek Pro. Без срока действия.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-end justify-between gap-2">
            <p className="text-2xl font-extrabold text-cr-text tabular-nums">
              {current_progress}{" "}
              <span className="text-base font-bold text-cr-muted">/ {required_referrals} друзей</span>
            </p>
            <p className="text-xs text-cr-muted text-right">
              Всего: {data.successful_referrals} · Наград: {data.rewards_earned} (+
              {data.days_earned_total} дн.)
            </p>
          </div>
          <div className="h-2 rounded-full bg-cr-border/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cr-blue to-cr-gold transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={cn(
              "text-sm leading-snug",
              justRewarded ? "text-cr-win font-semibold" : "text-cr-muted",
            )}
          >
            {progressHint}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="primary"
            className="flex-1 !py-2.5 text-base"
            onClick={inviteFriends}
          >
            Пригласить друзей
          </Button>
          <Button
            variant="secondary"
            className="!py-2.5 !px-3"
            onClick={() => void copyLink()}
            aria-label="Скопировать ссылку"
          >
            {copied ? <Check className="w-4 h-4 text-cr-win" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <p className="mt-2 text-2xs text-cr-muted break-all leading-snug">{data.referral_link}</p>
      </Card>
    </section>
  );
}
