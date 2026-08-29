import { MOTION_EASE, MOTION_ENTER, MOTION_MS } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/**
 * Единый enter для страниц и вкладок (mobile = desktop).
 * Opacity + небольшой translateY — GPU-friendly, без тяжёлого exit.
 */
export function useEnterMotionConfig() {
  return {
    initial: { opacity: 0, y: MOTION_ENTER.pageY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: MOTION_MS.normal / 1000,
      ease: easeOut,
    },
  };
}
