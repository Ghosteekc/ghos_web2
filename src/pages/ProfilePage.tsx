import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Trophy,
  Flame,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { useTelegram, usePageRefresh } from "@/hooks";
import { api } from "@/api/client";
import { Profile } from "@/types";
import { formatNumber, getWinColor, formatPlayerTag } from "@/utils";
import { UI } from "@/constants/labels";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";

function formatSubscription(subscription: Profile["subscription"]) {
  if (!subscription.active) {
    return { label: "Не активна", hint: subscription.trial_used ? "Пробный период использован" : "Оформите подписку" };
  }
  const expires = subscription.expires_at
    ? `до ${new Date(subscription.expires_at).toLocaleDateString("ru")}`
    : "";
  return { label: "Premium", hint: expires ? `Активна ${expires}` : "Активна" };
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const { nameRu } = useCardCatalog();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const p = await api.getProfile();
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Loader />;
  }

  const subscription = profile ? formatSubscription(profile.subscription) : null;

  return (
    <div className="space-y-6">
      <h1 className="page-title">Профиль</h1>

      {error && (
        <Card className="text-center">
          <p className="text-cr-loss mb-4">{error}</p>
          <Button onClick={() => void load()}>Повторить</Button>
        </Card>
      )}

      {profile && (
        <Card>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[3px] shadow-glow overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.player_name ?? "Player"}
                  className="w-full h-full rounded-full object-cover bg-cr-surface scale-110"
                />
              ) : profile.favorite_card_icon ? (
                <img
                  src={profile.favorite_card_icon}
                  alt={profile.favorite_card ?? "Card"}
                  className="w-full h-full rounded-full object-contain bg-cr-surface p-1.5"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-cr-surface flex items-center justify-center text-2xl font-extrabold text-cr-gold">
                  {(profile.player_name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-cr-text truncate">
                {profile.player_name ?? "Игрок"}
              </h2>
              <p className="text-cr-accent text-sm font-bold font-mono mt-1">
                {formatPlayerTag(profile.player_tag)}
              </p>
              <p className="text-xs text-cr-accent font-semibold mt-2 truncate">
                {profile.arena_name ?? "Арена не указана"}
              </p>
              {profile.favorite_card && (
                <p className="text-xs text-cr-gold font-bold mt-1 truncate">
                  ★ {nameRu(profile.favorite_card)}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 shrink-0 rounded-full bg-cr-surface border border-cr-border flex items-center justify-center">
            <User className="w-7 h-7 text-cr-muted" />
          </div>
          <div className="min-w-0">
          <p className="text-label mb-1">Telegram</p>
          <h2 className="text-base font-bold text-cr-text truncate">
            {user?.first_name ?? user?.username ?? "—"}
          </h2>
          <p className="text-cr-accent text-sm font-semibold mt-0.5 truncate">@{user?.username ?? "—"}</p>
          <p className="text-xs text-cr-accent font-medium mt-1">ID: {user?.id ?? "—"}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-cr-gold shrink-0" />
            <h3 className="text-sm font-semibold text-cr-text">Макс. кубки</h3>
          </div>
          <p className="text-2xl font-bold text-cr-text">
            {profile?.max_trophies != null ? formatNumber(profile.max_trophies) : "—"}
          </p>
          <p className="text-label mt-1">Лучший результат</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-cr-blue shrink-0" />
            <h3 className="text-sm font-semibold text-cr-text">Трофеи</h3>
          </div>
          <p className="text-2xl font-bold text-cr-text">
            {profile?.trophies != null ? formatNumber(profile.trophies) : "—"}
          </p>
          <p className="text-label mt-1">Текущий рейтинг</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-cr-win shrink-0" />
            <h3 className="text-sm font-semibold text-cr-text">{UI.winrate}</h3>
          </div>
          <p className={"text-2xl font-bold " + getWinColor(profile?.winrate ?? 50)}>
            {profile?.winrate != null ? `${profile.winrate.toFixed(1)}%` : "—"}
          </p>
          <p className="text-label mt-1">Процент побед</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-cr-gold shrink-0" />
            <h3 className="text-sm font-semibold text-cr-text">Подписка</h3>
          </div>
          <p className="text-lg font-bold text-cr-text">{subscription?.label ?? "—"}</p>
          <p className="text-label mt-1">{subscription?.hint ?? "—"}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-5 h-5 text-cr-gold" />
          <h3 className="text-sm font-semibold text-cr-text">Достижения</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          {["Первый бой", "10 побед", "100 игр", "Винрейт 60%", "Легенда"].map((achievement, i) => (
            <motion.div
              key={achievement}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="px-4 py-2 rounded-xl bg-cr-gold/10 border border-cr-gold/20 text-xs font-medium text-cr-gold"
            >
              {achievement}
            </motion.div>
          ))}
        </div>
      </Card>

      <Button
        variant="secondary"
        className="w-full max-w-md mx-auto flex items-center justify-center gap-2"
        onClick={() => navigate("/settings")}
      >
        <Settings className="w-4 h-4" />
        Открыть настройки
      </Button>
    </div>
  );
}

export { ProfilePage as default };
