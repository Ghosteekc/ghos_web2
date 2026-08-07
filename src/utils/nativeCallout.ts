import type { DragEvent, MouseEvent, SyntheticEvent } from "react";

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

/** Настоящие внешние ресурсы — callout/меню для них не блокируем. */
const EXTERNAL_HREF_RE = /^(https?:\/\/|\/\/|mailto:|tel:|tg:)/i;

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(EDITABLE_SELECTOR));
}

export function isExternalAnchor(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a[href]");
  if (!anchor) return false;
  const href = anchor.getAttribute("href")?.trim() ?? "";
  return EXTERNAL_HREF_RE.test(href);
}

export function isInternalAppHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const value = href.trim();
  if (!value || value.startsWith("#")) return false;
  if (EXTERNAL_HREF_RE.test(value)) return false;
  // Только явные app-пути — без «голых» относительных слов.
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("./") || value.startsWith("../")) return true;
  return false;
}

/** Блокирует системное меню long-press на внутренних UI-элементах. */
export function preventNativeCallout(event: SyntheticEvent | Event): void {
  event.preventDefault();
}

export function preventNativeCalloutIfInternal(
  event: MouseEvent | DragEvent | Event,
): boolean {
  const target = "target" in event ? event.target : null;
  if (isEditableElement(target) || isExternalAnchor(target)) {
    return false;
  }
  event.preventDefault();
  if ("stopPropagation" in event) {
    event.stopPropagation();
  }
  return true;
}

/** Props для внутренних кнопок / pressable UI (не для внешних <a>). */
export const internalPressableProps = {
  onContextMenu: preventNativeCallout,
  draggable: false as const,
};
