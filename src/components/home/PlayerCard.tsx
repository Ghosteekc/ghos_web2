import { motion } from "framer-motion";
import { Profile } from "@/types";
import { CircularProgress, LinearProgress } from "@/components/ui/Progress";
import { Trophy, Crown, Flame, Sword, Clock, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { UI } from "@/constants/labels";
import { formatNumber, getWinColor, getTrophyChangeColor, cn, formatPlayerTag } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { Card, Skeleton } from "@/components/ui";

interface PlayerCardProps {
  profile: Profile;
  loading?: boolean;
}

export function PlayerCard({ profile, loading }: PlayerCardProps) {
  const { nameRu } = useCardCatalog();
  if (loading) {
    return (
      <Card delay={0} className="overflow-hidden">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card delay={0} className="overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cr-blue/20 to-transparent" />
      <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
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
                  className="w-full h-full rounded-full object-contain bg-cr-surface p-1"
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
          <div>
            <h2 className="text-xl font-bold text-cr-text tracking-tight">
              {profile.player_name ?? "Игрок"}
            </h2>
            <p className="text-cr-accent text-sm font-bold font-mono mt-0.5">
              {formatPlayerTag(profile.player_tag)}
            </p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-cr-blue/10 border border-cr-blue/20 text-cr-blue text-xs font-medium">
              <Flame className="w-3 h-3" />
              {profile.arena_name ?? "Арена неизвестна"}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-wrap gap-6 lg:justify-end">
          <div className="text-center">
            <p className="text-xs text-cr-muted mb-1">Трофеи</p>
            <div className="flex items-baseline gap-1">
              <Trophy className="w-5 h-5 text-cr-gold" />
              <span className="text-2xl font-bold text-cr-text">
                {formatNumber(profile.trophies ?? 0)}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-cr-muted mb-1">Макс. кубки</p>
            <span className="text-2xl font-bold text-cr-text">
              {profile.max_trophies != null ? formatNumber(profile.max_trophies) : "—"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-cr-muted mb-1">{UI.winrate}</p>
            <span className={cn("text-2xl font-bold", getWinColor(profile.winrate ?? 50))}>
              {profile.winrate?.toFixed(1) ?? "—"}%
            </span>
          </div>
          <CircularProgress
            value={profile.winrate ?? 50}
            size={100}
            strokeWidth={6}
            label={profile.winrate ? `${profile.winrate.toFixed(0)}%` : "—"}
            sublabel={UI.winrate}
            color={profile.winrate && profile.winrate >= 50 ? "#22c55e" : "#ef4444"}
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-cr-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cr-bg/50">
            <div className="p-2 rounded-lg bg-cr-gold/10">
              <TrendingUp className="w-5 h-5 text-cr-gold" />
            </div>
            <div>
              <p className="text-xs text-cr-muted">Рост</p>
              <p className={cn("text-sm font-semibold", getTrophyChangeColor(profile.last_rating_change ?? 0))}>
                {(profile.last_rating_change ?? 0) > 0 ? "+" : ""}{profile.last_rating_change ?? 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cr-bg/50">
            <div className="p-2 rounded-lg bg-cr-blue/10">
              <Zap className="w-5 h-5 text-cr-blue" />
            </div>
            <div>
              <p className="text-xs text-cr-muted">Рейтинг скилла</p>
              <p className="text-sm font-semibold text-cr-text">{profile.skill_rating ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cr-bg/50">
            <div className="p-2 rounded-lg bg-cr-win/10">
              <Sword className="w-5 h-5 text-cr-win" />
            </div>
            <div>
              <p className="text-xs text-cr-muted">Любимая карта</p>
              <p className="text-sm font-semibold text-cr-text truncate">
                {profile.favorite_card ? nameRu(profile.favorite_card) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cr-bg/50">
            <div className="p-2 rounded-lg bg-cr-loss/10">
              <Clock className="w-5 h-5 text-cr-loss" />
            </div>
            <div>
              <p className="text-xs text-cr-muted">Аренда</p>
              <p className="text-sm font-semibold text-cr-text">{profile.arena_icon ? UI.subscriptionActive : "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}