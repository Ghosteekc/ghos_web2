import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import { isForceMotionEnabled } from "@/perf/bootstrap";
import { MOTION_EASE, MOTION_ENTER, MOTION_MS } from "./tokens";

interface TabTransitionProps {
  /** Уникальный ключ вкладки — remount + enter animation. */
  tabKey: string;
  children: ReactNode;
  className?: string;
}

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/**
 * Stable tab slot: keeps the previous panel visible through its short exit,
 * then reveals the new panel. The parent must remain mounted across tab keys.
 */
export function TabTransition({ tabKey, children, className }: TabTransitionProps) {
  const reducedMotion = useReducedMotion() && !isForceMotionEnabled();
  const duration = (reducedMotion ? MOTION_MS.fast : MOTION_MS.normal) / 1000;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={tabKey}
        className={cn("tab-motion-panel", className)}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: MOTION_ENTER.tabY }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : -2 }}
        transition={{ duration, ease: easeOut }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
