import { useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { MOTION_EASE } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/** Crossfade между route — только opacity, без translate (стабильнее на mobile). */
export function usePageMotionConfig() {
  const reduceMotion = useReducedMotion();

  return useMemo(() => {
    const fast = Boolean(reduceMotion);

    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: {
        duration: fast ? 0.14 : 0.2,
        ease: easeOut,
      },
      exitTransition: {
        duration: fast ? 0.1 : 0.14,
        ease: easeOut,
      },
    };
  }, [reduceMotion]);
}
