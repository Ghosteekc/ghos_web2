import { useCallback, useEffect, useState } from "react";
import { Card, Button, Loader, ErrorState, PageHeader } from "@/components/ui";
import { ProfileCollectionNav } from "@/components/profile/ProfileCollectionNav";
import { CardLevelScale } from "@/components/profile/CardLevelScale";
import { ProfileStatGrid } from "@/components/profile/ProfileStatGrid";
import { LeagueBanner, resolveLeagueInfo } from "@/components/profile/LeagueBanner";
import { SupercellDisclaimer } from "@/components/home/SupercellDisclaimer";
import { ProStatusBanner } from "@/components/pro";
import { usePageRefresh } from "@/hooks";
import { api } from "@/api/client";
import { Profile } from "@/types";
import { formatPlayerTag } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { cacheHas } from "@/api/cache";

export function ProfilePage() {
  const { nameRu } = useCardCatalog();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(() => !cacheHas("profile-v8"));
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

  const league =
    profile?.player_tag != null
      ? resolveLeagueInfo(profile.league, profile.trophies)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Профиль" />

      {error && (
        <ErrorState title={error} button="Повторить" onAction={() => void load()} />
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
                  className="w-full h-full rounded-full object-cover bg-cr-surface scale-125"
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
              <p className="text-cr-accent text-base font-bold font-mono mt-1">
                {formatPlayerTag(profile.player_tag)}
              </p>
              <p className="text-sm text-cr-win font-semibold mt-2 truncate">
                <span className="text-cr-win/70 font-medium">Клан · </span>
                {profile.clan_name?.trim() || "Без клана"}
              </p>
              <p className="text-sm text-cr-accent font-semibold mt-1 truncate">
                {profile.arena_name ?? "Арена не указана"}
              </p>
              {profile.favorite_card && (
                <p className="text-sm text-cr-gold font-bold mt-1 truncate">
                  ★ {nameRu(profile.favorite_card)}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {profile ? <ProStatusBanner subscription={profile.subscription} /> : null}

      {league ? (
        <Card className="!py-3 !px-4">
          <LeagueBanner league={league} />
        </Card>
      ) : null}

      {profile && <ProfileStatGrid profile={profile} />}

      {(profile?.cards_by_level?.length ?? 0) > 0 && (
        <Card className="!p-3">
          <h3 className="text-base font-semibold text-cr-text mb-1">Карты по уровням</h3>
          <p className="text-xs text-cr-muted mb-3">Сколько карт прокачано на каждый уровень</p>
          <CardLevelScale rows={profile!.cards_by_level} />
        </Card>
      )}

      <ProfileCollectionNav />

      <SupercellDisclaimer />
    </div>
  );
}

export { ProfilePage as default };
