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

export const formatPlayerTag = (tag: string | null | undefined): string => {
  if (!tag) return "—";
  const clean = tag.replace(/^#+/, "").trim();
  return clean ? `#${clean}` : "—";
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
  hapticImpact,
  hapticSelection,
  hapticNotify,
  withHaptic,
} from "./haptics";
export type { HapticImpact, HapticNotify } from "./haptics";