import { useState } from "react";
import { Trophy } from "lucide-react";
import type { LeagueInfo } from "@/types";
import { formatNumber } from "@/utils";

/** Current Jul–Aug 2026 Ranked gate; API usually overrides this. */
export const DEFAULT_LEAGUE_UNLOCK_TROPHIES = 13_000;
const ENTRY_LEAGUE_NAME = "Мастер I";
const ENTRY_LEAGUE_ICON = "https://royaleapi.github.io/cr-api-assets/arenas/league4.png";

export function lockedLeagueFallback(unlockTrophies = DEFAULT_LEAGUE_UNLOCK_TROPHIES): LeagueInfo {
  return {
    unlocked: false,
    unlock_trophies: unlockTrophies,
    current_league_number: null,
    current_league_name: null,
    current_league_icon: null,
    best_league_number: null,
    best_league_name: null,
    best_league_icon: null,
    is_absolute_champion: false,
    absolute_trophies: null,
  };
}

/** Cups below gate → unlock text; cups at/above gate (or API unlocked) → league strip. */
export function resolveLeagueInfo(
  league: LeagueInfo | null | undefined,
  trophies: number | null | undefined,
): LeagueInfo {
  const unlock = league?.unlock_trophies ?? DEFAULT_LEAGUE_UNLOCK_TROPHIES;
  const cups = trophies ?? 0;

  // Trust backend unlock flag; only open by cups if API omitted league entirely.
  if (league?.unlocked) {
    return league;
  }
  if (cups < unlock) {
    return lockedLeagueFallback(unlock);
  }

  if (league && (league.current_league_name || league.best_league_name || league.is_absolute_champion)) {
    return { ...league, unlocked: true };
  }

  return {
    unlocked: true,
    unlock_trophies: unlock,
    current_league_number: league?.current_league_number ?? 1,
    current_league_name: league?.current_league_name ?? ENTRY_LEAGUE_NAME,
    current_league_icon: league?.current_league_icon ?? ENTRY_LEAGUE_ICON,
    best_league_number: league?.best_league_number ?? 1,
    best_league_name: league?.best_league_name ?? ENTRY_LEAGUE_NAME,
    best_league_icon: league?.best_league_icon ?? ENTRY_LEAGUE_ICON,
    is_absolute_champion: false,
    absolute_trophies: null,
  };
}

interface LeagueBannerProps {
  league: LeagueInfo;
}

function LeagueIcon({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-9 h-9 shrink-0 rounded-lg bg-cr-surface border border-cr-border flex items-center justify-center">
        <Trophy className="w-4 h-4 text-cr-gold" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-9 h-9 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function LeagueName({ name }: { name: string }) {
  return (
    <p className="text-sm font-bold leading-snug text-cr-text [overflow-wrap:anywhere]">
      {name}
    </p>
  );
}

function LeagueSide({
  label,
  name,
  icon,
  align = "left",
}: {
  label: string;
  name: string;
  icon: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        "flex items-start gap-2 min-w-0 flex-1 " +
        (align === "right" ? "justify-end text-right flex-row-reverse" : "")
      }
    >
      <LeagueIcon src={icon} alt={name} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-2xs uppercase tracking-wide text-cr-muted font-semibold">{label}</p>
        <LeagueName name={name} />
      </div>
    </div>
  );
}

export function LeagueBanner({ league }: LeagueBannerProps) {
  if (!league.unlocked) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-cr-surface border border-cr-border flex items-center justify-center">
          <Trophy className="w-5 h-5 text-cr-muted" />
        </div>
        <p className="text-base text-cr-muted font-medium leading-snug">
          Лига открывается с{" "}
          <span className="text-cr-text font-bold tabular-nums">
            {formatNumber(league.unlock_trophies)}
          </span>{" "}
          кубков
        </p>
      </div>
    );
  }

  if (league.is_absolute_champion) {
    const name = league.current_league_name ?? "Абсолютный чемпион";
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <LeagueIcon src={league.current_league_icon} alt={name} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-2xs uppercase tracking-wide text-cr-muted font-semibold">Текущая лига</p>
            <LeagueName name={name} />
          </div>
        </div>
        <div className="shrink-0 text-right pt-0.5">
          <p className="text-2xs uppercase tracking-wide text-violet-400 font-semibold">Кубки лиги</p>
          <p className="text-lg font-extrabold tabular-nums text-violet-400 leading-none mt-0.5">
            {formatNumber(league.absolute_trophies ?? 0)}
          </p>
        </div>
      </div>
    );
  }

  const bestName = league.best_league_name ?? league.current_league_name ?? "—";
  const bestIcon = league.best_league_icon ?? league.current_league_icon;
  const currentName = league.current_league_name ?? "—";

  return (
    <div className="flex items-stretch gap-2.5">
      <LeagueSide label="Лучшая" name={bestName} icon={bestIcon} />
      <div className="w-px self-stretch bg-cr-border shrink-0" aria-hidden />
      <LeagueSide label="Текущая" name={currentName} icon={league.current_league_icon} align="right" />
    </div>
  );
}
