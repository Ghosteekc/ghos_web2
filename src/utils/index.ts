export function cn(...classes: (string | boolean | undefined | null | Record<string, boolean>)[]) {
  return classes
    .map((cls) => {
      if (typeof cls === "string") return cls;
      if (typeof cls === "boolean" || cls === null || cls === undefined) return "";
      if (typeof cls === "object") {
        return Object.entries(cls)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(" ");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const formatBattlePlayedAt = (timestamp: string, playedAt?: string): string => {
  if (playedAt) return playedAt;
  if (!timestamp || timestamp.length < 15) return "";
  try {
    const y = Number(timestamp.slice(0, 4));
    const mo = Number(timestamp.slice(4, 6)) - 1;
    const d = Number(timestamp.slice(6, 8));
    const h = Number(timestamp.slice(9, 11));
    const mi = Number(timestamp.slice(11, 13));
    const utc = Date.UTC(y, mo, d, h, mi);
    return new Date(utc).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    });
  } catch {
    return "";
  }
};

export const formatPlayerTag = (tag: string | null | undefined): string => {
  if (!tag) return "—";
  const clean = tag.replace(/^#+/, "").trim();
  return clean ? `#${clean}` : "—";
};

/** Stable battle URL — survives server restart (no session index). */
export const battleDetailPath = (timestamp: string, fallbackIndex?: number): string => {
  if (timestamp) {
    return `/battles/t/${encodeURIComponent(timestamp)}`;
  }
  if (fallbackIndex !== undefined) {
    return `/battles/${fallbackIndex}`;
  }
  return "/battles";
};

export const getWinColor = (winrate: number): string => {
  if (winrate >= 60) return "text-cr-win";
  if (winrate <= 40) return "text-cr-loss";
  return "text-cr-muted";
};

export const getTrophyChangeColor = (change: number): string => {
  if (change > 0) return "text-cr-win";
  if (change < 0) return "text-cr-loss";
  return "text-cr-muted";
};

export {
  getLastSyncAt,
  setLastSyncAt,
  formatLastSyncLabel,
  LAST_SYNC_EVENT,
} from "./lastSync";

export {
  hapticImpact,
  hapticManager,
  hapticNotify,
  hapticSelection,
  isHapticEnabled,
  setHapticEnabled,
  triggerHaptic,
  withHaptic,
} from "./haptics";
export type { HapticEvent, HapticImpact, HapticNotify } from "./haptics";