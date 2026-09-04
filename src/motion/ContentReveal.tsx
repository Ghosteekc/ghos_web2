import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { MOTION_EASE, MOTION_ENTER, MOTION_MS } from "./tokens";
import { isForceMotionEnabled } from "@/perf/bootstrap";

type ContentRevealProps = {
  loading: boolean;
  loader: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use when the child is already a TabTransition and owns its enter motion. */
  contentMotion?: "reveal" | "none";
  /** Reveal cached content when this component first mounts after a lazy route fallback. */
  revealOnMount?: boolean;
};

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];
const MINIMUM_LOADER_MS = 260;

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
  revealOnMount = false,
}: ContentRevealProps) {
  const reducedMotion = useReducedMotion() && !isForceMotionEnabled();
  const hasLoadedRef = useRef(loading);
  const loadingStartedAtRef = useRef<number | null>(loading ? performance.now() : null);
  const [holdingLoader, setHoldingLoader] = useState(loading);
  if (loading) {
    hasLoadedRef.current = true;
    loadingStartedAtRef.current ??= performance.now();
  }

  useEffect(() => {
    if (loading) {
      setHoldingLoader(true);
      return;
    }
    if (!holdingLoader) return;

    const elapsed = performance.now() - (loadingStartedAtRef.current ?? performance.now());
    const timer = window.setTimeout(() => {
      loadingStartedAtRef.current = null;
      setHoldingLoader(false);
    }, Math.max(0, MINIMUM_LOADER_MS - elapsed));
    return () => window.clearTimeout(timer);
  }, [holdingLoader, loading]);

  const visibleLoading = loading || holdingLoader;

  const shouldReveal = revealOnMount || hasLoadedRef.current;
  const contentInitial =
    contentMotion === "reveal" && shouldReveal
      ? reducedMotion ? { opacity: 0 } : { opacity: 0, y: MOTION_ENTER.tabY }
      : false;

  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="wait">
        {visibleLoading ? (
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
