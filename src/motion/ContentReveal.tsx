import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { MOTION_EASE, MOTION_MS } from "./tokens";

type ContentRevealProps = {
  loading: boolean;
  loader: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use when the child is already a TabTransition and owns its enter motion. */
  contentMotion?: "reveal" | "none";
};

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];

/**
 * Bridges an actual async state transition without coupling it to data fetching.
 * Cached content is left to the route enter animation; only loading -> ready reveals.
 */
export function ContentReveal({
  loading,
  loader,
  children,
  className,
  contentMotion = "reveal",
}: ContentRevealProps) {
  const hasLoadedRef = useRef(loading);
  if (loading) hasLoadedRef.current = true;

  const shouldReveal = hasLoadedRef.current;
  const contentInitial =
    contentMotion === "reveal" && shouldReveal ? { opacity: 0, y: 8 } : false;

  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            className="content-reveal-loader"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_MS.fast / 1000, ease: easeOut }}
          >
            {loader}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="content-reveal-content"
            initial={contentInitial}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_MS.normal / 1000, ease: easeOut }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
