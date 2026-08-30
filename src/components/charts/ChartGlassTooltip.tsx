import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { haptic } from "@/utils/hapticManager";

/**
 * Dock-style spring bubble tip (glass + stretch + haptics).
 * Set to `false` to instantly restore the previous flat glass tip.
 */
export const CHART_TIP_DOCK_BUBBLE = true;

export const ChartTooltipAnchorContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

type TooltipCoordinate = { x: number; y: number };

type ScrubState = {
  scrubbing: boolean;
  pinned: boolean;
  activeIndex: number | null;
};

type ChartScrubApi = ScrubState & {
  isVisible: boolean;
  coordinate: TooltipCoordinate | null;
  label: unknown;
  chartHandlers: {
    onMouseMove: (state: ChartPointerState | null) => void;
    onMouseLeave: () => void;
  };
  surfaceHandlers: {
    onPointerDown: (event: ReactPointerEvent) => void;
  };
  onTooltipPress: () => void;
  setActiveFromChart: (state: ChartPointerState | null) => void;
};

export type ChartPointerState = {
  isTooltipActive?: boolean;
  activeTooltipIndex?: number | string | null;
  activeCoordinate?: { x?: number; y?: number };
  activePayload?: unknown[];
  activeLabel?: unknown;
};

const ChartScrubContext = createContext<ChartScrubApi | null>(null);

const MOVE_THRESHOLD_PX = 14;
/** Stay on the current point until the finger clearly crosses into the next band. */
const INDEX_HYSTERESIS = 0.45;

/** Horizontal pull stretch while scrubbing — hard cap, never springs. */
const STRETCH_MAX = 1.055;
const POS_TWEEN = { type: "tween" as const, duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const };
const STRETCH_RELEASE = { type: "tween" as const, duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };
/** Fade-out only — appear is instant (no unfold) to avoid stuck partial scale. */
const FADE_OUT = { type: "tween" as const, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };
const FADE_OUT_MS = 220;

function readDockTopPx(): number {
  const nav = document.querySelector(".bottom-nav");
  if (nav instanceof HTMLElement) {
    const top = nav.getBoundingClientRect().top;
    if (Number.isFinite(top) && top > 0) return top;
  }
  return window.innerHeight - 112;
}

function getPlotRect(anchor: HTMLElement): DOMRect | null {
  const plot =
    (anchor.querySelector(".recharts-cartesian-grid") as SVGElement | null) ??
    (anchor.querySelector(".recharts-surface") as SVGElement | null) ??
    (anchor.querySelector(".recharts-wrapper") as HTMLElement | null);
  if (!plot) return null;
  const rect = plot.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

function continuousIndexFromClientX(
  plot: DOMRect,
  clientX: number,
  pointCount: number,
): number {
  if (pointCount <= 1) return 0;
  const ratio = (clientX - plot.left) / plot.width;
  return Math.min(pointCount - 1, Math.max(0, ratio * (pointCount - 1)));
}

function resolveIndexWithHysteresis(
  continuous: number,
  previous: number | null,
  pointCount: number,
): number {
  if (pointCount <= 1) return 0;
  if (previous == null) return Math.round(continuous);
  if (Math.abs(continuous - previous) < INDEX_HYSTERESIS) return previous;
  return Math.round(continuous);
}

/** Stable chart-local coordinate: X on the category band, Y fixed near the plot top. */
function coordinateForIndex(
  anchor: HTMLElement,
  plot: DOMRect,
  index: number,
  pointCount: number,
): TooltipCoordinate {
  const anchorRect = anchor.getBoundingClientRect();
  const t = pointCount <= 1 ? 0.5 : index / (pointCount - 1);
  return {
    x: plot.left + t * plot.width - anchorRect.left,
    y: plot.top + 12 - anchorRect.top,
  };
}

export function useChartScrub(): ChartScrubApi {
  const api = useContext(ChartScrubContext);
  if (!api) {
    throw new Error("useChartScrub must be used inside ChartTooltipAnchor");
  }
  return api;
}

function useOptionalChartScrub(): ChartScrubApi | null {
  return useContext(ChartScrubContext);
}

export function ChartTooltipAnchor({
  children,
  className,
  pointCount = 0,
}: {
  children: ReactNode;
  className?: string;
  pointCount?: number;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [coordinate, setCoordinate] = useState<TooltipCoordinate | null>(null);

  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const indexAtPointerDownRef = useRef<number | null>(null);
  const pinnedRef = useRef(pinned);
  const activeIndexRef = useRef(activeIndex);
  const pointCountRef = useRef(pointCount);
  const moveRafRef = useRef<number | null>(null);
  const pendingClientXRef = useRef<number | null>(null);
  const detachWindowListenersRef = useRef<(() => void) | null>(null);
  const lastHapticIndexRef = useRef<number | null>(null);

  pinnedRef.current = pinned;
  activeIndexRef.current = activeIndex;
  pointCountRef.current = pointCount;

  const clearTransient = useCallback(() => {
    setActiveIndex(null);
    setCoordinate(null);
    setScrubbing(false);
    lastHapticIndexRef.current = null;
  }, []);

  const applyClientX = useCallback((clientX: number): number | null => {
    const anchor = anchorRef.current;
    if (!anchor) return null;
    const count = pointCountRef.current;
    if (count <= 0) return null;
    const plot = getPlotRect(anchor);
    if (!plot) return null;

    const continuous = continuousIndexFromClientX(plot, clientX, count);
    const idx = resolveIndexWithHysteresis(continuous, activeIndexRef.current, count);
    const nextCoord = coordinateForIndex(anchor, plot, idx, count);

    if (activeIndexRef.current !== idx) {
      activeIndexRef.current = idx;
      setActiveIndex(idx);
      if (CHART_TIP_DOCK_BUBBLE && pointerIdRef.current != null && lastHapticIndexRef.current !== idx) {
        lastHapticIndexRef.current = idx;
        haptic.selection();
      }
    }
    setCoordinate((prev) => {
      if (prev && Math.abs(prev.x - nextCoord.x) < 0.5 && Math.abs(prev.y - nextCoord.y) < 0.5) {
        return prev;
      }
      return nextCoord;
    });
    return idx;
  }, []);

  const scheduleApplyClientX = useCallback(
    (clientX: number) => {
      pendingClientXRef.current = clientX;
      if (moveRafRef.current != null) return;
      moveRafRef.current = requestAnimationFrame(() => {
        moveRafRef.current = null;
        const x = pendingClientXRef.current;
        pendingClientXRef.current = null;
        if (x != null) applyClientX(x);
      });
    },
    [applyClientX],
  );

  const setActiveFromChart = useCallback((_state: ChartPointerState | null) => {
    // Intentionally ignored: dual updates from Recharts caused tip jitter.
  }, []);

  const chartHandlers = useMemo(
    () => ({
      onMouseMove: (_state: ChartPointerState | null) => {},
      onMouseLeave: () => {
        if (!pinnedRef.current && pointerIdRef.current == null) {
          clearTransient();
        }
      },
    }),
    [clearTransient],
  );

  const surfaceHandlers = useMemo(
    () => ({
      onPointerDown: (event: ReactPointerEvent) => {
        if (event.button !== 0 && event.pointerType === "mouse") return;
        // Keep the gesture on the chart — vertical scroll must not steal a tap.
        if (event.cancelable) event.preventDefault();

        detachWindowListenersRef.current?.();
        if (moveRafRef.current != null) {
          cancelAnimationFrame(moveRafRef.current);
          moveRafRef.current = null;
        }

        pointerIdRef.current = event.pointerId;
        startRef.current = { x: event.clientX, y: event.clientY };
        movedRef.current = false;
        indexAtPointerDownRef.current = activeIndexRef.current;
        lastHapticIndexRef.current = activeIndexRef.current;
        setScrubbing(true);
        if (CHART_TIP_DOCK_BUBBLE) haptic.light();
        applyClientX(event.clientX);

        const onMove = (moveEvent: PointerEvent) => {
          if (pointerIdRef.current !== moveEvent.pointerId || !startRef.current) return;
          // Only horizontal scrub counts as a drag. Vertical jitter on the top
          // of the chart (or slight scroll intent) must not cancel a tap-to-pin.
          const dx = moveEvent.clientX - startRef.current.x;
          if (Math.abs(dx) >= MOVE_THRESHOLD_PX) {
            movedRef.current = true;
          }
          scheduleApplyClientX(moveEvent.clientX);
        };

        const finishPointer = (upEvent: PointerEvent) => {
          if (pointerIdRef.current !== upEvent.pointerId) return;
          const wasMoved = movedRef.current;
          const indexAtStart = indexAtPointerDownRef.current;

          if (moveRafRef.current != null) {
            cancelAnimationFrame(moveRafRef.current);
            moveRafRef.current = null;
          }
          pendingClientXRef.current = null;

          pointerIdRef.current = null;
          startRef.current = null;
          movedRef.current = false;
          indexAtPointerDownRef.current = null;
          detachWindowListenersRef.current?.();
          detachWindowListenersRef.current = null;

          // Horizontal drag → show only while finger was down, then hide.
          if (wasMoved) {
            setScrubbing(false);
            if (!pinnedRef.current) {
              clearTransient();
            }
            return;
          }

          // Clean tap (ignore vertical jitter) → pin until the tip is tapped again.
          const indexToPin = applyClientX(upEvent.clientX) ?? activeIndexRef.current ?? indexAtStart;
          if (indexToPin == null) {
            setScrubbing(false);
            clearTransient();
            return;
          }
          pinnedRef.current = true;
          setPinned(true);
          setScrubbing(false);
          activeIndexRef.current = indexToPin;
          setActiveIndex(indexToPin);
          if (CHART_TIP_DOCK_BUBBLE) haptic.selection();
        };

        const onUp = (upEvent: PointerEvent) => finishPointer(upEvent);
        const onCancel = (upEvent: PointerEvent) => finishPointer(upEvent);

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
        detachWindowListenersRef.current = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onCancel);
        };
      },
    }),
    [applyClientX, scheduleApplyClientX, clearTransient],
  );

  const onTooltipPress = useCallback(() => {
    if (!pinnedRef.current) return;
    pinnedRef.current = false;
    setPinned(false);
    if (CHART_TIP_DOCK_BUBBLE) haptic.light();
    clearTransient();
  }, [clearTransient]);

  const api = useMemo<ChartScrubApi>(
    () => ({
      scrubbing,
      pinned,
      activeIndex,
      coordinate,
      label: null,
      isVisible: activeIndex != null && (scrubbing || pinned),
      chartHandlers,
      surfaceHandlers,
      onTooltipPress,
      setActiveFromChart,
    }),
    [
      scrubbing,
      pinned,
      activeIndex,
      coordinate,
      chartHandlers,
      surfaceHandlers,
      onTooltipPress,
      setActiveFromChart,
    ],
  );

  return (
    <ChartTooltipAnchorContext.Provider value={anchorRef}>
      <ChartScrubContext.Provider value={api}>
        <div
          ref={anchorRef}
          className={className}
          data-point-count={pointCount}
          style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
          {...surfaceHandlers}
        >
          {children}
        </div>
      </ChartScrubContext.Provider>
    </ChartTooltipAnchorContext.Provider>
  );
}

function useTooltipPlacement(
  rendered: boolean,
  coordinate: TooltipCoordinate | null | undefined,
  children: ReactNode,
  pinned: boolean,
  measureRef: RefObject<HTMLElement | null>,
  anchorRef: RefObject<HTMLDivElement | null> | null,
) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const measuredSizeRef = useRef({ w: 168, h: 96 });

  useLayoutEffect(() => {
    if (!rendered || !anchorRef?.current || coordinate == null) {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const measureEl = measureRef.current;
      if (!anchor) return;

      if (measureEl) {
        // Layout size only — ignore visual transforms so the tip cannot grow itself.
        const w = measureEl.offsetWidth;
        const h = measureEl.offsetHeight;
        if (w > 0 && h > 0) {
          measuredSizeRef.current = {
            w: Math.min(w, window.innerWidth - 16),
            h: Math.min(h, Math.round(window.innerHeight * 0.42)),
          };
        }
      }

      const rect = anchor.getBoundingClientRect();
      const tipW = measuredSizeRef.current.w;
      const tipH = measuredSizeRef.current.h;
      const margin = 8;
      const dockTop = readDockTopPx();

      // Store LEFT edge (not center) so we never need translateX — transforms kill backdrop-filter.
      const centerX = rect.left + coordinate.x;
      let left = centerX - tipW / 2;
      left = Math.min(window.innerWidth - margin - tipW, Math.max(margin, left));

      let top = rect.top + 6;
      const maxTop = dockTop - tipH - margin;
      top = Math.max(margin, Math.min(top, maxTop));

      setPosition((prev) => {
        if (prev && Math.abs(prev.left - left) < 0.5 && Math.abs(prev.top - top) < 0.5) {
          return prev;
        }
        return { left, top };
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [rendered, anchorRef, coordinate?.x, coordinate?.y, pinned, children, measureRef]);

  return position;
}

function ChartTooltipBubbleShell({
  active,
  coordinate,
  children,
  contentKey,
}: {
  active?: boolean;
  coordinate?: TooltipCoordinate | null;
  children: ReactNode;
  contentKey?: string | number | null;
}) {
  const anchorRef = useContext(ChartTooltipAnchorContext);
  const scrub = useOptionalChartScrub();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
  const [nudge, setNudge] = useState(false);
  const lastKeyRef = useRef(contentKey);
  const seededRef = useRef(false);
  const moveControlsRef = useRef<{ stop: () => void }[]>([]);
  const fadeControlsRef = useRef<{ stop: () => void }[]>([]);
  const hideTimerRef = useRef<number | null>(null);

  const mvLeft = useMotionValue(0);
  const mvTop = useMotionValue(0);
  const mvOpacity = useMotionValue(0);
  const mvScaleX = useMotionValue(1);
  const mvScaleY = useMotionValue(1);
  const scaleXSafe = useTransform(mvScaleX, (v) => Math.min(STRETCH_MAX, Math.max(0.97, v)));
  const scaleYSafe = useTransform(mvScaleY, (v) => Math.min(1.02, Math.max(0.97, v)));
  const scrubbing = scrub?.scrubbing ?? false;

  const pinned = scrub?.pinned ?? false;
  const wantVisible = scrub ? scrub.isVisible && Boolean(active) : Boolean(active);
  const position = useTooltipPlacement(rendered, coordinate, children, pinned, bubbleRef, anchorRef);

  const stopMove = useCallback(() => {
    moveControlsRef.current.forEach((c) => c.stop());
    moveControlsRef.current = [];
  }, []);

  const stopFade = useCallback(() => {
    fadeControlsRef.current.forEach((c) => c.stop());
    fadeControlsRef.current = [];
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const resetStretch = useCallback(() => {
    mvScaleX.set(1);
    mvScaleY.set(1);
  }, [mvScaleX, mvScaleY]);

  const showInstant = useCallback(() => {
    clearHideTimer();
    stopFade();
    stopMove();
    resetStretch();
    mvOpacity.set(1);
    setShown(true);
  }, [clearHideTimer, stopFade, stopMove, resetStretch, mvOpacity]);

  const playFadeOut = useCallback(() => {
    clearHideTimer();
    stopFade();
    stopMove();
    resetStretch();
    setShown(false);
    seededRef.current = false;
    fadeControlsRef.current = [animate(mvOpacity, 0, FADE_OUT)];
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      stopFade();
      mvOpacity.set(0);
      resetStretch();
      setRendered(false);
    }, FADE_OUT_MS);
  }, [clearHideTimer, stopFade, stopMove, resetStretch, mvOpacity]);

  useEffect(() => {
    if (wantVisible) {
      clearHideTimer();
      stopFade();
      setRendered(true);
      return;
    }
    if (!rendered) return;
    playFadeOut();
  }, [wantVisible, rendered, playFadeOut, clearHideTimer, stopFade]);

  useEffect(() => {
    return () => {
      clearHideTimer();
      stopFade();
      stopMove();
    };
  }, [clearHideTimer, stopFade, stopMove]);

  useEffect(() => {
    if (!wantVisible) {
      lastKeyRef.current = contentKey;
      setNudge(false);
      return;
    }
    if (contentKey == null || contentKey === lastKeyRef.current) {
      lastKeyRef.current = contentKey;
      return;
    }
    lastKeyRef.current = contentKey;
    setNudge(false);
    const id = requestAnimationFrame(() => setNudge(true));
    return () => cancelAnimationFrame(id);
  }, [contentKey, wantVisible]);

  useEffect(() => {
    if (!wantVisible || !position || !rendered) return;

    if (!seededRef.current) {
      seededRef.current = true;
      mvLeft.set(position.left);
      mvTop.set(position.top);
      showInstant();
      return;
    }

    stopMove();
    const prevLeft = mvLeft.get();
    const adx = Math.abs(position.left - prevLeft);

    if (scrubbing) {
      mvLeft.set(position.left);
      mvTop.set(position.top);
      if (adx > 2) {
        const stretch = Math.min(STRETCH_MAX, 1 + adx / 220);
        mvScaleX.set(stretch);
        mvScaleY.set(Math.max(0.97, 1 / Math.sqrt(stretch)));
      }
      return;
    }

    moveControlsRef.current = [
      animate(mvLeft, position.left, POS_TWEEN),
      animate(mvTop, position.top, POS_TWEEN),
      animate(mvScaleX, 1, STRETCH_RELEASE),
      animate(mvScaleY, 1, STRETCH_RELEASE),
    ];
  }, [
    wantVisible,
    rendered,
    position?.left,
    position?.top,
    scrubbing,
    showInstant,
    stopMove,
    mvLeft,
    mvTop,
    mvScaleX,
    mvScaleY,
  ]);

  useEffect(() => {
    if (scrubbing || !shown || !seededRef.current || !wantVisible) return;
    const sx = animate(mvScaleX, 1, STRETCH_RELEASE);
    const sy = animate(mvScaleY, 1, STRETCH_RELEASE);
    return () => {
      sx.stop();
      sy.stop();
    };
  }, [scrubbing, shown, wantVisible, mvScaleX, mvScaleY]);

  if (!rendered) return null;

  return createPortal(
    <div
      className={`chart-tooltip-bubble-anchor${shown && position ? " is-shown" : ""}`}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      <motion.div
        ref={bubbleRef}
        className={`chart-tooltip-bubble${pinned ? " is-pinned" : ""}`}
        role={pinned ? "button" : undefined}
        tabIndex={pinned ? 0 : undefined}
        aria-label={pinned ? "Закрыть подсказку" : undefined}
        onPointerDown={
          pinned
            ? (event) => {
                event.stopPropagation();
                event.preventDefault();
              }
            : undefined
        }
        onClick={
          pinned
            ? (event) => {
                event.stopPropagation();
                scrub?.onTooltipPress();
              }
            : undefined
        }
        onKeyDown={
          pinned
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  scrub?.onTooltipPress();
                }
              }
            : undefined
        }
        style={{
          position: "fixed",
          left: mvLeft,
          top: mvTop,
          opacity: mvOpacity,
          scaleX: scaleXSafe,
          scaleY: scaleYSafe,
          transformOrigin: "50% 50%",
          pointerEvents: pinned && shown ? "auto" : "none",
          cursor: pinned ? "pointer" : "default",
        }}
      >
        <span className="chart-tooltip-bubble-glass" aria-hidden />
        <span className="chart-tooltip-bubble-ring" aria-hidden />
        <div className="chart-tooltip-bubble-content">
          <div
            className={`chart-tooltip-body${nudge ? " chart-tooltip-body--nudge" : ""}`}
            onAnimationEnd={() => setNudge(false)}
          >
            {children}
          </div>
          <p
            className="chart-tooltip-hint"
            style={{ opacity: pinned ? 1 : 0 }}
            aria-hidden={!pinned}
          >
            Нажми,
            <br />
            чтобы закрыть
          </p>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function ChartTooltipLegacyShell({
  active,
  coordinate,
  children,
  contentKey,
}: {
  active?: boolean;
  coordinate?: TooltipCoordinate | null;
  children: ReactNode;
  contentKey?: string | number | null;
}) {
  const anchorRef = useContext(ChartTooltipAnchorContext);
  const scrub = useOptionalChartScrub();
  const shellRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
  const [nudge, setNudge] = useState(false);
  const lastKeyRef = useRef(contentKey);

  const pinned = scrub?.pinned ?? false;
  const wantVisible = scrub ? scrub.isVisible && Boolean(active) : Boolean(active);
  const position = useTooltipPlacement(rendered, coordinate, children, pinned, shellRef, anchorRef);

  useEffect(() => {
    if (wantVisible) {
      setRendered(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setRendered(false), 180);
    return () => window.clearTimeout(t);
  }, [wantVisible]);

  useEffect(() => {
    if (!wantVisible) {
      lastKeyRef.current = contentKey;
      setNudge(false);
      return;
    }
    if (contentKey == null || contentKey === lastKeyRef.current) {
      lastKeyRef.current = contentKey;
      return;
    }
    lastKeyRef.current = contentKey;
    setNudge(false);
    const id = requestAnimationFrame(() => setNudge(true));
    return () => cancelAnimationFrame(id);
  }, [contentKey, wantVisible]);

  if (!rendered) return null;

  return createPortal(
    <div
      ref={shellRef}
      className={`chart-tooltip-glass px-3 py-2 text-sm shadow-lg${shown && position ? " is-shown" : ""}`}
      role={pinned ? "button" : undefined}
      tabIndex={pinned ? 0 : undefined}
      aria-label={pinned ? "Закрыть подсказку" : undefined}
      onPointerDown={
        pinned
          ? (event) => {
              event.stopPropagation();
              event.preventDefault();
            }
          : undefined
      }
      onClick={
        pinned
          ? (event) => {
              event.stopPropagation();
              scrub?.onTooltipPress();
            }
          : undefined
      }
      onKeyDown={
        pinned
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                scrub?.onTooltipPress();
              }
            }
          : undefined
      }
      style={{
        position: "fixed",
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        transform: "translate(-50%, 0)",
        zIndex: 40,
        pointerEvents: pinned && shown ? "auto" : "none",
        cursor: pinned ? "pointer" : "default",
        minWidth: 156,
      }}
    >
      <div
        className={`chart-tooltip-body${nudge ? " chart-tooltip-body--nudge" : ""}`}
        onAnimationEnd={() => setNudge(false)}
      >
        {children}
      </div>
      <p
        className="chart-tooltip-hint"
        style={{ opacity: pinned ? 1 : 0 }}
        aria-hidden={!pinned}
      >
        Нажми, чтобы закрыть
      </p>
    </div>,
    document.body,
  );
}

export function ChartGlassTooltipShell({
  active,
  coordinate,
  children,
  contentKey,
}: {
  active?: boolean;
  coordinate?: TooltipCoordinate | null;
  children: ReactNode;
  /** Stable key for the selected point — soft content nudge, never blanks the tip. */
  contentKey?: string | number | null;
  offsetY?: number;
}) {
  if (CHART_TIP_DOCK_BUBBLE) {
    return (
      <ChartTooltipBubbleShell active={active} coordinate={coordinate} contentKey={contentKey}>
        {children}
      </ChartTooltipBubbleShell>
    );
  }
  return (
    <ChartTooltipLegacyShell active={active} coordinate={coordinate} contentKey={contentKey}>
      {children}
    </ChartTooltipLegacyShell>
  );
}

/** Bind Recharts chart mouse handlers + controlled Tooltip visibility. */
export function chartTooltipProps(scrub: ChartScrubApi): {
  active: boolean;
  wrapperStyle: CSSProperties;
  contentStyle: CSSProperties;
} {
  return {
    active: scrub.isVisible,
    wrapperStyle: { outline: "none" },
    contentStyle: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: 0,
    },
  };
}
