import { Profile } from "@/types";
import { Crown, Flame } from "lucide-react";
import { formatPlayerTag } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { Card, Loader } from "@/components/ui";

interface PlayerCardProps {
  profile: Profile;
  loading?: boolean;
}

export function PlayerCard({ profile, loading }: PlayerCardProps) {
  const { nameRu } = useCardCatalog();

  if (loading) {
    return (
      <Card delay={0} className="overflow-hidden">
        <Loader compact showLabel={false} />
      </Card>
    );
  }

  return (
    <Card delay={0} className="overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-cr-blue/20 to-transparent" />
      <div className="relative flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[3px] shadow-glow overflow-hidden">
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
          <div className="absolute -bottom-1 -right-1 bg-cr-bg rounded-full p-1 border-2 border-cr-card">
            <Crown className="w-4 h-4 text-cr-gold" />
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold text-cr-text tracking-tight truncate">
            {profile.player_name ?? "Игрок"}
          </h2>
          <p className="text-cr-accent text-base font-bold font-mono mt-0.5">
            {formatPlayerTag(profile.player_tag)}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-cr-blue/10 border border-cr-blue/20 text-cr-blue text-sm font-medium max-w-full">
            <Flame className="w-3 h-3 shrink-0" />
            <span className="truncate">{profile.arena_name ?? "Арена неизвестна"}</span>
          </span>
          {profile.favorite_card && (
            <p className="text-sm text-cr-gold font-bold mt-2 truncate">
              ★ {nameRu(profile.favorite_card)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
