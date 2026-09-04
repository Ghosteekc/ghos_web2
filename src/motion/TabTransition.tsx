import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/utils";
import { isForceMotionEnabled } from "@/perf/bootstrap";
import { notifyPerfTransitionStart } from "@/perf/motionSample";
import { MOTION_EASE, MOTION_ENTER, MOTION_MS } from "./tokens";
import { TabLoadingContext } from "./TabLoadingContext";

interface TabTransitionProps {
  /** Уникальный ключ вкладки — remount + enter animation. */
  tabKey: string;
  /** Keep the same handoff loader visible while this tab's data is resolving. */
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];
// The outgoing panel takes about one normal motion duration to leave. Hold the
// handoff for that exit plus one short loader beat, rather than relying on a
// Framer callback that can be skipped with AnimatePresence initial={false}.
const HANDOFF_HOLD_MS = MOTION_MS.normal + MOTION_MS.fast;

/**
 * Stable tab slot: keeps the previous panel visible through its short exit,
 * then reveals the new panel. The parent must remain mounted across tab keys.
 */
export function TabTransition({ tabKey, loading = false, children, className }: TabTransitionProps) {
  const reducedMotion = useReducedMotion() && !isForceMotionEnabled();
  const stageRef = useRef<HTMLDivElement>(null);
  const previousTabRef = useRef(tabKey);
  const previousContentHeightRef = useRef(0);
  const mountedRef = useRef(false);
  const hasHandoffRef = useRef(false);
  const loaderTimerRef = useRef<number | null>(null);
  const nestedLoaderIdsRef = useRef(new Set<string>());
  const [loaderKey, setLoaderKey] = useState<string | null>(null);
  const [reservedHeight, setReservedHeight] = useState(0);
  const [, setNestedLoaderVersion] = useState(0);
  const duration = (reducedMotion ? MOTION_MS.fast : MOTION_MS.normal) / 1000;
  const tabChanged = previousTabRef.current !== tabKey;
  if (tabChanged) previousTabRef.current = tabKey;
  const nestedLoading = hasHandoffRef.current && nestedLoaderIdsRef.current.size > 0;
  const showingLoader = tabChanged || loading || loaderKey === tabKey || nestedLoading;

  const registerNestedLoader = useCallback((id: string, active: boolean) => {
    const loaders = nestedLoaderIdsRef.current;
    const changed = active ? !loaders.has(id) : loaders.delete(id);
    if (!changed) return;
    if (active) loaders.add(id);
    setNestedLoaderVersion((version) => version + 1);
  }, []);

  const scheduleLoaderRelease = (key: string) => {
    if (loaderTimerRef.current !== null) {
      window.clearTimeout(loaderTimerRef.current);
    }

    loaderTimerRef.current = window.setTimeout(() => {
      loaderTimerRef.current = null;
      setLoaderKey((current) => (current === key ? null : current));
    }, HANDOFF_HOLD_MS);
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    hasHandoffRef.current = true;
    notifyPerfTransitionStart();
    setReservedHeight(previousContentHeightRef.current);
    setLoaderKey(tabKey);
    scheduleLoaderRelease(tabKey);

    return () => {
      if (loaderTimerRef.current !== null) {
        window.clearTimeout(loaderTimerRef.current);
        loaderTimerRef.current = null;
      }
    };
  }, [tabKey]);

  useEffect(() => {
    if (!loading) return;
    setLoaderKey(tabKey);
    scheduleLoaderRelease(tabKey);
  }, [loading, tabKey]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Store the last finished panel height. On the next tab change it is used
    // synchronously by the loader render, before the browser can clamp scrollY.
    if (!showingLoader) {
      previousContentHeightRef.current = Math.ceil(stage.getBoundingClientRect().height);
    }
  }, [showingLoader, tabKey]);

  useEffect(() => {
    if (showingLoader) return;
    const stage = stageRef.current;
    if (!stage) return;
    const timer = window.setTimeout(() => {
      setReservedHeight(0);
    }, MOTION_MS.normal);
    return () => window.clearTimeout(timer);
  }, [showingLoader, tabKey]);

  return (
    <div
      ref={stageRef}
      className="tab-motion-stage"
      style={{ minHeight: reservedHeight || (showingLoader ? previousContentHeightRef.current : undefined) || undefined }}
    >
      <TabLoadingContext.Provider value={registerNestedLoader}>
        <motion.div
          key={tabKey}
          className={cn(
            "tab-motion-panel",
            hasHandoffRef.current && "tab-motion-panel--handoff",
            className,
          )}
          initial={false}
          animate={
            showingLoader
              ? { opacity: 0, y: reducedMotion ? 0 : MOTION_ENTER.tabY }
              : { opacity: 1, y: 0 }
          }
          transition={{
            duration,
            delay: showingLoader ? 0 : MOTION_MS.fast / 1000,
            ease: easeOut,
          }}
          style={{ visibility: showingLoader ? "hidden" : undefined }}
        >
          {children}
        </motion.div>
      </TabLoadingContext.Provider>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence initial={false}>
              {showingLoader ? (
                <motion.div
                  key={`loader:${tabKey}`}
                  className="tab-motion-loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION_MS.fast / 1000, ease: easeOut }}
                >
                  <TabLoadingContext.Provider value={null}>
                    <Loader variant="section" />
                  </TabLoadingContext.Provider>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
