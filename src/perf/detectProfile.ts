import type { RenderProfile } from "./types";

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function isCoarsePointer(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return "ontouchstart" in window;
  }
}

function iosMajor(): number | null {
  const ua = navigator.userAgent || "";
  const match = /OS (\d+)(?:[._]\d+)*/i.exec(ua);
  if (!match) return null;
  return Number(match[1]) || null;
}

function isIPadLike(): boolean {
  const ua = navigator.userAgent || "";
  if (/iPad/i.test(ua)) return true;
  // iPadOS desktop UA
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * Оценка возможностей устройства.
 * Не сводит качество к mobile/desktop — учитывает cores/memory/FPS later.
 */
export function detectInitialProfile(): RenderProfile {
  if (typeof window === "undefined") return "medium";

  if (prefersReducedMotion()) return "low";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null;
  const touch = isCoarsePointer();
  const minSide = Math.min(window.screen.width, window.screen.height);
  const maxSide = Math.max(window.screen.width, window.screen.height);
  const ios = iosMajor();
  const ipad = isIPadLike();

  let score = 0;

  if (cores >= 8) score += 3;
  else if (cores >= 6) score += 2;
  else if (cores >= 4) score += 1;

  if (memory != null) {
    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else if (memory >= 2) score += 0;
    else score -= 1;
  } else if (!touch) {
    // Desktop без deviceMemory — обычно достаточно мощный.
    score += 2;
  }

  if (!touch) score += 2;
  else if (ipad && maxSide >= 1024) score += 2;
  else if (ios != null && ios >= 16) score += 2; // iPhone 13+ / современные flagships
  else if (ios != null && ios >= 15) score += 1;
  else if (touch && cores <= 4 && (memory == null || memory <= 3)) score -= 1;

  if (minSide >= 900) score += 1;

  // Telegram Mini App на слабом Android часто даёт 4 cores + мало RAM.
  if (touch && cores <= 4 && memory != null && memory <= 2) {
    return "low";
  }

  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export function downgradeProfile(profile: RenderProfile): RenderProfile {
  if (profile === "high") return "medium";
  if (profile === "medium") return "low";
  return "low";
}

export { prefersReducedMotion, isCoarsePointer };
