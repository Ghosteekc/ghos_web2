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
  | "confirm"
  | "double"
  /** @deprecated Use `double` */
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

function canPlayHaptic(): boolean {
  return userHapticEnabled && Boolean(tgHaptic());
}

function safeImpact(style: HapticImpact): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.impactOccurred?.(style);
  } catch {
    /* ignore */
  }
}

function safeSelection(): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.selectionChanged?.();
  } catch {
    /* ignore */
  }
}

function safeNotification(type: HapticNotify): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.notificationOccurred?.(type);
  } catch {
    /* ignore */
  }
}

function scheduleImpact(style: HapticImpact, delayMs: number): void {
  if (!canPlayHaptic()) return;
  window.setTimeout(() => safeImpact(style), delayMs);
}

/**
 * Trigger a semantic haptic event.
 * Respects user setting and Telegram API availability.
 */
export function triggerHaptic(event: HapticEvent): void {
  if (!canPlayHaptic()) return;

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
    case "confirm":
      safeImpact("medium");
      break;
    case "double":
    case "important":
      safeImpact("medium");
      scheduleImpact("light", 90);
      break;
    default:
      break;
  }
}

/** Primary haptic API for the Mini App. */
export const haptic = {
  setEnabled: setHapticEnabled,
  isEnabled: isHapticEnabled,
  light: () => triggerHaptic("lightTap"),
  medium: () => triggerHaptic("mediumTap"),
  heavy: () => triggerHaptic("heavyTap"),
  success: () => triggerHaptic("success"),
  warning: () => triggerHaptic("warning"),
  error: () => triggerHaptic("error"),
  selection: () => triggerHaptic("selection"),
  double: () => triggerHaptic("double"),
  confirm: () => triggerHaptic("confirm"),
};

/** @deprecated Prefer `haptic.light()` / `triggerHaptic()` */
export function hapticImpact(style: HapticImpact = "light"): void {
  const map: Record<HapticImpact, HapticEvent> = {
    light: "lightTap",
    soft: "lightTap",
    rigid: "mediumTap",
    medium: "mediumTap",
    heavy: "heavyTap",
  };
  triggerHaptic(map[style]);
}

/** @deprecated Prefer `haptic.selection()` */
export function hapticSelection(): void {
  triggerHaptic("selection");
}

/** @deprecated Prefer `haptic.success()` / `haptic.warning()` / `haptic.error()` */
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

/** Back-compat facade; prefer `haptic`. */
export const hapticManager = {
  setEnabled: haptic.setEnabled,
  isEnabled: haptic.isEnabled,
  trigger: triggerHaptic,
  lightTap: haptic.light,
  mediumTap: haptic.medium,
  heavyTap: haptic.heavy,
  selection: haptic.selection,
  success: haptic.success,
  warning: haptic.warning,
  error: haptic.error,
  confirm: haptic.confirm,
  double: haptic.double,
  important: haptic.double,
};
