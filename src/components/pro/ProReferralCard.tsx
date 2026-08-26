import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import { Button, Card, Loader } from "@/components/ui";
import { api, ApiError } from "@/api/client";
import { usePageRefresh, useTelegram } from "@/hooks";
import { haptic } from "@/utils/hapticManager";
import type { ReferralStatus } from "@/types";

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
      setData(await api.getReferralStatus({ fresh: true }));
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
    const reward = data.credits_reward_amount || 10;
    const text = encodeURIComponent(
      `Присоединяйся к Ghosteek — ассистенту для Clash Royale. По моей ссылке скидка на Pro, и мы оба получим +${reward} Credits:`,
    );
    const url = encodeURIComponent(data.referral_link);
    const sharePath = `share/url?url=${url}&text=${text}`;
    if (tg?.openTelegramLink) {
      openTelegramLink(sharePath);
      return;
    }
    window.open(`https://t.me/${sharePath}`, "_blank");
  }, [data?.referral_link, data?.credits_reward_amount, openTelegramLink, tg]);

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

  const friends = data.friends_purchased ?? data.successful_referrals ?? 0;
  const reward = data.credits_reward_amount || 10;
  const earned = data.credits_earned_from_referrals ?? friends * reward;

  return (
    <section className="space-y-3" aria-labelledby="pro-referral-heading">
      <h2 id="pro-referral-heading" className="text-base font-semibold text-cr-text">
        Приглашения
      </h2>
      <Card className="pro-referral-card glass-card ui-enter !p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-cr-blue/15 border border-cr-blue/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-cr-blue" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-cr-text leading-tight">
              Приглашай друзей — получай Credits
            </h3>
            <p className="text-sm text-cr-muted leading-snug mt-1">
              За каждого приведённого друга вы и ваш друг получаете по +{reward} Credits. Credits
              хранятся без ограничений по времени.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-2xl font-extrabold text-cr-text tabular-nums">
            {friends}{" "}
            <span className="text-base font-bold text-cr-muted">
              {friendsWord(friends)} купили Pro
            </span>
          </p>
          <p className="text-sm text-cr-muted">
            Ты получил:{" "}
            <span className="font-bold text-cr-gold tabular-nums">+{earned} Credits</span>
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="primary" className="flex-1 !py-2.5 text-base" onClick={inviteFriends}>
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
