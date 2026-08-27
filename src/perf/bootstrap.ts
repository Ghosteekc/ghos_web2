import { applyRenderProfile } from "./applyProfile";
import { detectInitialProfile, prefersReducedMotion } from "./detectProfile";

/**
 * Telegram / phones often report prefers-reduced-motion (Low Power, WebView).
 * That freezes loaders and UI enter animations while desktop stays lively.
 * Force motion there so Mini App feels the same on mobile and PC.
 */
export function enableForceMotionIfNeeded(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  try {
    const inTelegram = Boolean(window.Telegram?.WebApp);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (inTelegram || coarse) {
      document.documentElement.dataset.forceMotion = "1";
    }
  } catch {
    /* ignore */
  }
}

export function isForceMotionEnabled(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.forceMotion === "1";
}

/** Синхронно до первого paint — без вспышки blur:none. */
export function bootstrapPerfProfile(): void {
  if (typeof document === "undefined") return;
  enableForceMotionIfNeeded();
  const honorReduce = !isForceMotionEnabled() && prefersReducedMotion();
  const profile = honorReduce ? "low" : detectInitialProfile();
  applyRenderProfile(profile, null);
}
