import { useEffect } from "react";

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

/**
 * Блокирует системное меню Android/iOS (Open / Copy Link) при долгом тапе
 * по UI Mini App. Поля ввода не затрагиваются.
 */
export function useDisableSystemGestures() {
  useEffect(() => {
    const onContextMenu = (event: Event) => {
      if (isEditableEventTarget(event.target)) return;
      event.preventDefault();
    };

    const onDragStart = (event: DragEvent) => {
      if (isEditableEventTarget(event.target)) return;
      event.preventDefault();
    };

    const onSelectStart = (event: Event) => {
      if (isEditableEventTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("dragstart", onDragStart, { capture: true });
    document.addEventListener("selectstart", onSelectStart, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("dragstart", onDragStart, { capture: true });
      document.removeEventListener("selectstart", onSelectStart, { capture: true });
    };
  }, []);
}
