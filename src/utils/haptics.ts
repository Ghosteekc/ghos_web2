export type HapticImpact = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotify = "error" | "success" | "warning";

const IMPACT_MS: Record<HapticImpact, number> = {
  light: 8,
  soft: 6,
  medium: 16,
  rigid: 12,
  heavy: 28,
};

function tgHaptic() {
  return typeof window !== "undefined" ? window.Telegram?.WebApp?.HapticFeedback : undefined;
}

/** Короткий удар — кнопки, карточки */
export function hapticImpact(style: HapticImpact = "light") {
  const h = tgHaptic();
  if (h?.impactOccurred) {
    h.impactOccurred(style);
    return;
  }
  navigator.vibrate?.(IMPACT_MS[style]);
}

/** Переключение вкладок, тумblers, пункты меню */
export function hapticSelection() {
  const h = tgHaptic();
  if (h?.selectionChanged) {
    h.selectionChanged();
    return;
  }
  navigator.vibrate?.(5);
}

/** Уведомления об успехе / ошибке */
export function hapticNotify(type: HapticNotify) {
  const h = tgHaptic();
  if (h?.notificationOccurred) {
    h.notificationOccurred(type);
    return;
  }
  const patterns: Record<HapticNotify, number | number[]> = {
    success: [10, 40, 12],
    warning: [12, 60, 12],
    error: [18, 80, 18, 80, 22],
  };
  navigator.vibrate?.(patterns[type]);
}

/** Обёртка для onClick с вибрацией */
export function withHaptic<T extends (...args: never[]) => void>(
  fn: T | undefined,
  style: HapticImpact | "selection" = "light",
): T | undefined {
  if (!fn) return undefined;
  return ((...args: Parameters<T>) => {
    if (style === "selection") hapticSelection();
    else hapticImpact(style);
    fn(...args);
  }) as T;
}
