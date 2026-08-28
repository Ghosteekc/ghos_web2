import { isForceMotionEnabled } from "@/perf/bootstrap";
import { prefersReducedMotion } from "@/perf/detectProfile";
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

  const honorReduce = !isForceMotionEnabled() && prefersReducedMotion();
  if (honorReduce) {
    root.dataset.motionReduced = "1";
  } else {
    delete root.dataset.motionReduced;
  }
}
