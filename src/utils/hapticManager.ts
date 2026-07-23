/**
 * Centralized Telegram Mini App haptic feedback.
 * Never throws; silently skips when disabled or unsupported.
 */

export type HapticImpact = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotify = "error" | "success" | "warning";

/** Semantic haptic events used across the app. */
export type HapticEvent =
  | "lightTap"
  | "mediumTap"
  | "heavyTap"
  | "selection"
  | "success"
  | "warning"
  | "error"
  | "important";

let userHapticEnabled = true;

export function setHapticEnabled(enabled: boolean): void {
  userHapticEnabled = enabled;
}

export function isHapticEnabled(): boolean {
  return userHapticEnabled;
}

function tgHaptic() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp?.HapticFeedback;
}

function safeImpact(style: HapticImpact): void {
  try {
    tgHaptic()?.impactOccurred?.(style);
  } catch {
    /* ignore */
  }
}

function safeSelection(): void {
  try {
    tgHaptic()?.selectionChanged?.();
  } catch {
    /* ignore */
  }
}

function safeNotification(type: HapticNotify): void {
  try {
    tgHaptic()?.notificationOccurred?.(type);
  } catch {
    /* ignore */
  }
}

function scheduleImpact(style: HapticImpact, delayMs: number): void {
  window.setTimeout(() => safeImpact(style), delayMs);
}

/**
 * Trigger a semantic haptic event.
 * Respects user setting and Telegram API availability.
 */
export function triggerHaptic(event: HapticEvent): void {
  if (!userHapticEnabled) return;
  if (!tgHaptic()) return;

  switch (event) {
    case "lightTap":
      safeImpact("light");
      break;
    case "mediumTap":
      safeImpact("medium");
      break;
    case "heavyTap":
      safeImpact("heavy");
      break;
    case "selection":
      safeSelection();
      break;
    case "success":
      safeNotification("success");
      break;
    case "warning":
      safeNotification("warning");
      break;
    case "error":
      safeNotification("error");
      break;
    case "important":
      safeImpact("medium");
      scheduleImpact("light", 90);
      break;
    default:
      break;
  }
}

/** @deprecated Prefer triggerHaptic("lightTap" | "mediumTap" | "heavyTap") */
export function hapticImpact(style: HapticImpact = "light"): void {
  if (!userHapticEnabled || !tgHaptic()) return;
  const map: Record<HapticImpact, HapticEvent> = {
    light: "lightTap",
    soft: "lightTap",
    rigid: "mediumTap",
    medium: "mediumTap",
    heavy: "heavyTap",
  };
  triggerHaptic(map[style]);
}

/** @deprecated Prefer triggerHaptic("selection") */
export function hapticSelection(): void {
  triggerHaptic("selection");
}

/** @deprecated Prefer triggerHaptic("success" | "warning" | "error") */
export function hapticNotify(type: HapticNotify): void {
  triggerHaptic(type);
}

export function withHaptic<T extends (...args: never[]) => void>(
  fn: T | undefined,
  event: HapticEvent = "lightTap",
): T | undefined {
  if (!fn) return undefined;
  return ((...args: Parameters<T>) => {
    triggerHaptic(event);
    fn(...args);
  }) as T;
}

/** Haptic manager facade for explicit imports. */
export const hapticManager = {
  setEnabled: setHapticEnabled,
  isEnabled: isHapticEnabled,
  trigger: triggerHaptic,
  lightTap: () => triggerHaptic("lightTap"),
  mediumTap: () => triggerHaptic("mediumTap"),
  heavyTap: () => triggerHaptic("heavyTap"),
  selection: () => triggerHaptic("selection"),
  success: () => triggerHaptic("success"),
  warning: () => triggerHaptic("warning"),
  error: () => triggerHaptic("error"),
  important: () => triggerHaptic("important"),
};
