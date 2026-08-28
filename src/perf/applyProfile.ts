import { PROFILE_TOKENS, type PerfSnapshot, type RenderProfile } from "./types";
import { isCoarsePointer } from "./detectProfile";
import { applyMotionTokens } from "@/motion/bootstrap";

const ROOT_ATTR = "data-perf";

export function applyRenderProfile(
  profile: RenderProfile,
  fps: number | null = null,
): PerfSnapshot {
  const t = PROFILE_TOKENS[profile];
  const root = document.documentElement;
  root.setAttribute(ROOT_ATTR, profile);

  const glassBlur = `blur(${t.blurPx}px) saturate(${t.saturate}%)`;
  const seedBlur = `blur(${t.seedBlurPx}px) saturate(${Math.max(120, t.saturate - 10)}%)`;

  root.style.setProperty("--perf-profile", profile);
  root.style.setProperty("--perf-blur-px", `${t.blurPx}px`);
  root.style.setProperty("--perf-seed-blur-px", `${t.seedBlurPx}px`);
  root.style.setProperty("--perf-glow-scale", String(t.glowScale));
  root.style.setProperty("--perf-shadow-scale", String(t.shadowScale));
  root.style.setProperty("--perf-enter-y", `${t.enterYPx}px`);

  root.style.setProperty("--cr-glass-blur", glassBlur);
  root.style.setProperty("--comp-constructor-seed-blur", seedBlur);
  root.style.setProperty("--cr-glass-bg", `rgb(var(--cr-card) / ${t.glassAlpha})`);
  root.style.setProperty("--cr-glass-bg-strong", `rgb(var(--cr-card) / ${t.glassAlphaStrong})`);

  root.style.setProperty(
    "--comp-glow-gold",
    `0 0 ${Math.round(20 * t.glowScale)}px rgb(var(--palette-glow-gold) / ${0.15 * t.glowScale})`,
  );
  root.style.setProperty(
    "--comp-glow-blue",
    `0 0 ${Math.round(20 * t.glowScale)}px rgb(var(--palette-glow-blue) / ${0.15 * t.glowScale})`,
  );

  root.style.setProperty("--ui-duration", `${t.durationMs}ms`);
  root.style.setProperty("--ui-duration-fast", `${t.durationFastMs}ms`);

  applyMotionTokens({
    fast: t.durationFastMs,
    normal: t.durationMs,
    page: Math.round(t.durationMs * 1.15),
    slow: Math.round(t.durationMs * 1.45),
  });

  // Мягче тени на LOW/MEDIUM — без смены геометрии UI.
  if (profile !== "high") {
    const soft = t.shadowScale;
    root.style.setProperty(
      "--ui-shadow-soft",
      `0 ${Math.round(6 * soft)}px ${Math.round(18 * soft)}px rgb(var(--palette-black) / ${0.22 * soft})`,
    );
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null;

  return {
    profile,
    blurPx: t.blurPx,
    seedBlurPx: t.seedBlurPx,
    glassAlpha: t.glassAlpha,
    glowScale: t.glowScale,
    shadowScale: t.shadowScale,
    durationMs: t.durationMs,
    durationFastMs: t.durationFastMs,
    enterYPx: t.enterYPx,
    fps,
    cores,
    memoryGb: memory,
    touch: isCoarsePointer(),
    reducedMotion: false,
  };
}

export function readCurrentProfile(): RenderProfile {
  const v = document.documentElement.getAttribute(ROOT_ATTR);
  if (v === "high" || v === "medium" || v === "low") return v;
  return "medium";
}
