import { applyRenderProfile } from "./applyProfile";
import { detectInitialProfile, prefersReducedMotion } from "./detectProfile";

/** Синхронно до первого paint — без вспышки blur:none. */
export function bootstrapPerfProfile(): void {
  if (typeof document === "undefined") return;
  const profile = prefersReducedMotion() ? "low" : detectInitialProfile();
  applyRenderProfile(profile, null);
}
