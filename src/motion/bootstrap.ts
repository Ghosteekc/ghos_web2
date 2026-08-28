import { MOTION_MS, motionMsToCss } from "./tokens";

export type MotionMsOverrides = Partial<Record<keyof typeof MOTION_MS, number>>;

/** Синхронизировать motion tokens с :root (после perf profile). */
export function applyMotionTokens(overrides?: MotionMsOverrides): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const ms = { ...MOTION_MS, ...overrides };

  root.style.setProperty("--ui-duration-fast", motionMsToCss(ms.fast));
  root.style.setProperty("--ui-duration", motionMsToCss(ms.normal));
  root.style.setProperty("--ui-duration-page", motionMsToCss(ms.page));
  root.style.setProperty("--ui-duration-slow", motionMsToCss(ms.slow));

  // Motion always on — parity mobile/desktop (see forceMotion + MotionConfig).
  delete root.dataset.motionReduced;
}
