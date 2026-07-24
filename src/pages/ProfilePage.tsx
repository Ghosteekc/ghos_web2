import { useCallback, useEffect, useState } from "react";
import { User } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { ProfileCollectionNav } from "@/components/profile/ProfileCollectionNav";
import { CardLevelScale } from "@/components/profile/CardLevelScale";
import { ProfileStatGrid } from "@/components/profile/ProfileStatGrid";
import { SupercellDisclaimer } from "@/components/home/SupercellDisclaimer";
import { useTelegram, usePageRefresh } from "@/hooks";
import { api } from "@/api/client";
import { Profile } from "@/types";
import { formatPlayerTag } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { cacheHas } from "@/api/cache";

export function ProfilePage() {
  const { user } = useTelegram();
  const { nameRu } = useCardCatalog();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(() => !cacheHas("profile-v4"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const p = await api.getProfile();
      setProfile(p);
      api.prefetchDeckTabs();
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
        <Card className="!p-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[2px] shadow-glow overflow-hidden">
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

      <Card className="!p-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-full bg-cr-surface border border-cr-border flex items-center justify-center">
            <User className="w-5 h-5 text-cr-muted" />
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

      {profile && <ProfileStatGrid profile={profile} />}

      {(profile?.cards_by_level?.length ?? 0) > 0 && (
        <Card className="!p-3">
          <h3 className="text-sm font-semibold text-cr-text mb-1">Карты по уровням</h3>
          <p className="text-[11px] text-cr-muted mb-3">Сколько карт прокачано на каждый уровень</p>
          <CardLevelScale rows={profile!.cards_by_level} />
        </Card>
      )}

      <ProfileCollectionNav />

      <SupercellDisclaimer />
    </div>
  );
}

export { ProfilePage as default };
