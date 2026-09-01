import { MOTION_EASE, MOTION_ENTER, MOTION_MS } from "./tokens";
import { useReducedMotion } from "framer-motion";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/**
 * Единый enter для страниц и вкладок (mobile = desktop).
 * Opacity + небольшой translateY — GPU-friendly, без тяжёлого exit.
 */
export function useEnterMotionConfig(kind: "page" | "tab" = "page") {
  const reducedMotion = useReducedMotion();
  const y = kind === "page" ? MOTION_ENTER.pageY : MOTION_ENTER.tabY;

  return {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: (reducedMotion ? MOTION_MS.fast : kind === "page" ? MOTION_MS.page : MOTION_MS.normal) / 1000,
      ease: easeOut,
    },
  };
}
