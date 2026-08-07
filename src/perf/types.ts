/**
 * Adaptive Rendering — RenderProfile HIGH | MEDIUM | LOW.
 * Меняет стоимость эффектов, не дизайн и не «выкл. blur».
 */

export type RenderProfile = "high" | "medium" | "low";

export type PerfSnapshot = {
  profile: RenderProfile;
  blurPx: number;
  seedBlurPx: number;
  glassAlpha: number;
  glowScale: number;
  shadowScale: number;
  durationMs: number;
  durationFastMs: number;
  enterYPx: number;
  fps: number | null;
  cores: number;
  memoryGb: number | null;
  touch: boolean;
  reducedMotion: boolean;
};

export type ProfileTokens = {
  blurPx: number;
  seedBlurPx: number;
  glassAlpha: number;
  glassAlphaStrong: number;
  glowScale: number;
  shadowScale: number;
  durationMs: number;
  durationFastMs: number;
  enterYPx: number;
  saturate: number;
};

export const PROFILE_TOKENS: Record<RenderProfile, ProfileTokens> = {
  high: {
    blurPx: 20,
    seedBlurPx: 16,
    glassAlpha: 0.42,
    glassAlphaStrong: 0.55,
    glowScale: 1,
    shadowScale: 1,
    durationMs: 300,
    durationFastMs: 220,
    enterYPx: 8,
    saturate: 150,
  },
  medium: {
    blurPx: 11,
    seedBlurPx: 10,
    glassAlpha: 0.55,
    glassAlphaStrong: 0.68,
    glowScale: 0.7,
    shadowScale: 0.8,
    durationMs: 220,
    durationFastMs: 180,
    enterYPx: 5,
    saturate: 140,
  },
  low: {
    blurPx: 6,
    seedBlurPx: 6,
    glassAlpha: 0.72,
    glassAlphaStrong: 0.82,
    glowScale: 0.3,
    shadowScale: 0.45,
    durationMs: 160,
    durationFastMs: 130,
    enterYPx: 3,
    saturate: 130,
  },
};

declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}
