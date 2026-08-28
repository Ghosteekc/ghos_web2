import { MOTION_EASE, MOTION_MS } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/** Единый crossfade между route — одинаково на mobile и desktop. */
export function usePageMotionConfig() {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: MOTION_MS.page / 1000,
      ease: easeOut,
    },
    exitTransition: {
      duration: MOTION_MS.fast / 1000,
      ease: easeOut,
    },
  };
}
