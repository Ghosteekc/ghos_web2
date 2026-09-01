/**
 * Единая motion system Ghosteek WebApp.
 * Используйте эти пресеты вместо разрозненных duration: 0.17 / 0.31 / …
 */

export const MOTION_MS = {
  /** Press feedback: 120–160ms */
  fast: 140,
  /** UI state changes: 180–240ms */
  normal: 200,
  /** Page / tab enter: 220–320ms */
  page: 260,
  /** Modal / sheet: 300–380ms */
  slow: 340,
} as const;

export const MOTION_EASE = {
  out: [0.22, 0.08, 0.24, 1] as const,
  standard: [0.2, 0.8, 0.2, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,
} as const;

export const MOTION_ENTER = {
  /** Page / tab soft slide from bottom (px) */
  pageY: 14,
  tabY: 10,
  pressScale: 0.98,
  pressScaleDeep: 0.97,
  cardScaleFrom: 0.96,
} as const;

/** CSS custom property names (set on :root). */
export const MOTION_CSS_VARS = {
  fast: "--ui-duration-fast",
  normal: "--ui-duration",
  page: "--ui-duration-page",
  slow: "--ui-duration-slow",
  easeOut: "--ui-ease-out",
  easeStandard: "--ui-ease-standard",
  enterY: "--perf-enter-y",
} as const;

export function motionMsToCss(ms: number): string {
  return `${ms}ms`;
}
