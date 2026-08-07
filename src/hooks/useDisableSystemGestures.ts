import { useEffect } from "react";
import {
  isEditableElement,
  isExternalAnchor,
  preventNativeCalloutIfInternal,
} from "@/utils/nativeCallout";

/**
 * Android / Telegram WebView: убирает «Открыть / Копировать ссылку» с URL приложения
 * при long-press по UI. Внешние <a href="https://…"> и поля ввода не трогаем.
 */
export function useDisableSystemGestures() {
  useEffect(() => {
    const onContextMenu = (event: Event) => {
      preventNativeCalloutIfInternal(event);
    };

    const onDragStart = (event: DragEvent) => {
      const target = event.target;
      if (isEditableElement(target) || isExternalAnchor(target)) return;
      // Блокируем drag preview у картинок и кнопок — частый триггер меню на Android.
      if (
        target instanceof HTMLImageElement ||
        (target instanceof Element &&
          target.closest("button, [role='button'], img, .tg-no-callout, .card-tile-wrap"))
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("dragstart", onDragStart, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("dragstart", onDragStart, { capture: true });
    };
  }, []);
}
