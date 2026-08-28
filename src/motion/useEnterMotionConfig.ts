import { MOTION_EASE, MOTION_ENTER, MOTION_MS } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/** Единый enter для вкладок — одинаково на mobile и desktop. */
export function useEnterMotionConfig() {
  return {
    initial: { opacity: 0, y: MOTION_ENTER.tabY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: MOTION_MS.fast / 1000,
      ease: easeOut,
    },
  };
}
