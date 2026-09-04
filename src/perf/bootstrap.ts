import { applyRenderProfile } from "./applyProfile";
import { detectInitialProfile } from "./detectProfile";

/**
 * Единый motion на mobile и desktop.
 * Telegram / Low Power часто выставляют prefers-reduced-motion — без force
 * CSS и Framer гасят анимации только на телефоне.
 */
export function enableForceMotionIfNeeded(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.forceMotion = "1";
}

export function isForceMotionEnabled(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.forceMotion === "1";
}

/** Синхронно до первого paint — без вспышки blur:none. */
export function bootstrapPerfProfile(): void {
  if (typeof document === "undefined") return;
  applyRenderProfile(detectInitialProfile(), null);
}
