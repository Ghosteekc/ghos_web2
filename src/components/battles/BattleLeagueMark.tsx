import { useState } from "react";
import { cn } from "@/utils";
import type { BattleLeagueBadge } from "@/types";

interface BattleLeagueChipProps {
  league: BattleLeagueBadge | null | undefined;
  fallback?: string;
  align?: "left" | "right";
  compact?: boolean;
}

function LeagueIcon({ src, alt, compact }: { src: string | null; alt: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = compact ? "h-5 w-5" : "h-6 w-6";
  if (!src || failed) {
    return null;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn(size, "shrink-0 object-contain")}
      onError={() => setFailed(true)}
    />
  );
}

export function BattleLeagueChip({
  league,
  fallback = "—",
  align = "left",
  compact = false,
}: BattleLeagueChipProps) {
  const name = league?.league_name ?? fallback;
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      <LeagueIcon src={league?.league_icon ?? null} alt={name} compact={compact} />
      <span className={cn("truncate font-semibold text-cr-text", compact ? "text-xs" : "text-sm")}>
        {name}
      </span>
    </span>
  );
}

interface BattleLeaguePairProps {
  user?: BattleLeagueBadge | null;
  opponent?: BattleLeagueBadge | null;
  compact?: boolean;
  className?: string;
}

/** Лига пути, на которой сыгран бой (без «vs соперник»). */
export function BattleLeaguePair({ user, opponent, compact = false, className }: BattleLeaguePairProps) {
  const league = user ?? opponent;
  if (!league) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BattleLeagueChip league={league} compact={compact} />
    </div>
  );
}

/** В Path of Legends считаются ступени, не кубки. */
export function formatLeagueStepChange(won: boolean): string {
  return won ? "+1 ступень" : "−1 ступень";
}

export function leagueStepDelta(won: boolean): number {
  return won ? 1 : -1;
}

export function BattleLeagueBadgeLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-cr-gold/15 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wide text-cr-gold",
        className,
      )}
    >
      Лига
    </span>
  );
}
