import { useEffect } from "react";

import { triggerHaptic } from "@/utils/hapticManager";

const INTERACTIVE_SELECTOR =
  "button:not([disabled]), [role='switch']:not([disabled]), .filter-tab, .feature-nav-btn, .pixel-btn, .collection-filter-tab, .segment-tab, .sidebar-item, .sidebar-overlay, .toggle-switch";

function shouldUseSelectionHaptic(target: Element) {
  return (
    target.getAttribute("role") === "switch" ||
    target.classList.contains("toggle-switch") ||
    target.classList.contains("filter-tab") ||
    target.classList.contains("feature-nav-btn") ||
    target.classList.contains("pixel-btn") ||
    target.classList.contains("collection-filter-tab") ||
    target.classList.contains("segment-tab") ||
    target.classList.contains("sidebar-item")
  );
}

function triggerElementHaptic(target: Element) {
  if (shouldUseSelectionHaptic(target)) {
    triggerHaptic("selection");
  }
}

export function useGlobalButtonHaptics() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = (event.target as Element | null)?.closest(INTERACTIVE_SELECTOR);
      if (!target || target.closest("[data-no-haptic]") || target.matches("[data-no-haptic]")) {
        return;
      }

      triggerElementHaptic(target);
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, []);
}
