import { MOTION_EASE, MOTION_MS } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/** @deprecated Используйте useEnterMotionConfig — единый enter для страниц и вкладок. */
export function usePageMotionConfig() {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: {
      duration: MOTION_MS.normal / 1000,
      ease: easeOut,
    },
    exitTransition: {
      duration: MOTION_MS.fast / 1000,
      ease: easeOut,
    },
  };
}
