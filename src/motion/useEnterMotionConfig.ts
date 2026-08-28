import { useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { readCurrentProfile } from "@/perf/applyProfile";
import { isCoarsePointer } from "@/perf/detectProfile";
import { MOTION_EASE } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/** Opacity-only enter on touch / low perf — меньше дёрганий на телефоне. */
export function useEnterMotionConfig() {
  const reduceMotion = useReducedMotion();

  return useMemo(() => {
    const coarse = typeof window !== "undefined" && isCoarsePointer();
    const profile = typeof document !== "undefined" ? readCurrentProfile() : "medium";
    const fadeOnly = Boolean(reduceMotion) || coarse || profile !== "high";

    return {
      initial: { opacity: 0, y: fadeOnly ? 0 : 4 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: fadeOnly ? 0.15 : 0.2,
        ease: easeOut,
      },
      fadeOnly,
    };
  }, [reduceMotion]);
}
