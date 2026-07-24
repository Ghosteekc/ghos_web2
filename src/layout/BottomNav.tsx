import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { animate, motion, useMotionValue } from "framer-motion";
import { triggerHaptic } from "@/utils/hapticManager";
import { MAIN_NAV_ITEMS, getActiveNavId, type MainNavItem } from "./navigation";

const TAB_COUNT = MAIN_NAV_ITEMS.length;
const BUBBLE_HIT_X = 58;
const BUBBLE_HIT_Y = 50;

const STRETCH_TWEEN = { type: "tween" as const, duration: 0.18, ease: [0.22, 0.08, 0.24, 1] as const };
const NEAR_TAB_TWEEN = { type: "tween" as const, duration: 0.34, ease: [0.28, 0.1, 0.22, 1] as const };

const NEAR_TAB_SPRING = { stiffness: 215, damping: 37, mass: 0.86 };
const FAR_TAB_SPRING = { stiffness: 270, damping: 23, mass: 0.72 };

function getTabSteps(fromIndex: number, toIndex: number): number {
  return Math.max(1, Math.abs(toIndex - fromIndex));
}

function getSpringForTabDistance(fromIndex: number, toIndex: number) {
  const steps = getTabSteps(fromIndex, toIndex);
  if (steps <= 1) {
    return { type: "spring" as const, ...NEAR_TAB_SPRING };
  }

  const t = Math.min((steps - 1) / Math.max(TAB_COUNT - 2, 1), 1);

  return {
    type: "spring" as const,
    stiffness: NEAR_TAB_SPRING.stiffness + t * (FAR_TAB_SPRING.stiffness - NEAR_TAB_SPRING.stiffness),
    damping: NEAR_TAB_SPRING.damping + t * (FAR_TAB_SPRING.damping - NEAR_TAB_SPRING.damping),
    mass: NEAR_TAB_SPRING.mass + t * (FAR_TAB_SPRING.mass - NEAR_TAB_SPRING.mass),
  };
}

function getMoveTransition(fromIndex: number, toIndex: number) {
  if (getTabSteps(fromIndex, toIndex) <= 1) {
    return NEAR_TAB_TWEEN;
  }
  return getSpringForTabDistance(fromIndex, toIndex);
}

function getReleaseTransition(fromIndex: number, toIndex: number) {
  if (getTabSteps(fromIndex, toIndex) <= 1) {
    return STRETCH_TWEEN;
  }
  return getReleaseSpringForTabDistance(fromIndex, toIndex);
}

function getReleaseSpringForTabDistance(fromIndex: number, toIndex: number) {
  const moveSpring = getSpringForTabDistance(fromIndex, toIndex);
  return {
    ...moveSpring,
    stiffness: moveSpring.stiffness * 0.92,
    damping: moveSpring.damping + 3,
  };
}

const STRETCH_X_MAX = 0.32;
const STRETCH_X_MIN = 0.03;
const STRETCH_Y_MAX = 0.12;
const STRETCH_Y_MIN = 0.012;

function stretchFromPull(pull: number, tabSteps = 1): { x: number; y: number } {
  if (tabSteps <= 1) {
    return {
      x: 1 + Math.min(pull / 220, 0.03),
      y: 1 - Math.min(pull / 320, 0.012),
    };
  }

  const t = Math.min((tabSteps - 1) / Math.max(TAB_COUNT - 2, 1), 1);
  const stretchXMax = STRETCH_X_MIN + t * (STRETCH_X_MAX - STRETCH_X_MIN);
  const stretchYMax = STRETCH_Y_MIN + t * (STRETCH_Y_MAX - STRETCH_Y_MIN);
  const pullDivisorX = 92 - t * 32;
  const pullDivisorY = 170 - t * 45;

  return {
    x: 1 + Math.min(pull / pullDivisorX, stretchXMax),
    y: Math.max(1 - stretchYMax, 1 - Math.min(pull / pullDivisorY, stretchYMax)),
  };
}

type BubbleSpring = ReturnType<typeof getSpringForTabDistance>;
type BubbleTransition = BubbleSpring | typeof STRETCH_TWEEN | typeof NEAR_TAB_TWEEN;

const STRETCH_EPSILON = 0.002;

function readCssRemVar(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  if (raw.endsWith("rem")) return parseFloat(raw) * rootFontSize;
  if (raw.endsWith("px")) return parseFloat(raw);
  return parseFloat(raw) || 0;
}

function indexFromX(x: number, centers: number[]): number {
  let nearest = 0;
  let minDist = Infinity;
  centers.forEach((center, index) => {
    const dist = Math.abs(x - center);
    if (dist < minDist) {
      minDist = dist;
      nearest = index;
    }
  });
  return nearest;
}

function isNearBubble(
  pointerX: number,
  pointerY: number,
  bubbleX: number,
  trackHeight: number,
): boolean {
  const centerY = trackHeight * 0.5;
  return (
    Math.abs(pointerX - bubbleX) <= BUBBLE_HIT_X &&
    Math.abs(pointerY - centerY) <= BUBBLE_HIT_Y
  );
}

type BottomNavItemProps = {
  item: MainNavItem;
  index: number;
  isActive: boolean;
  isHighlighted: boolean;
  onItemRef: (index: number, el: HTMLAnchorElement | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLAnchorElement>) => void;
};

const BottomNavItem = memo(function BottomNavItem({
  item,
  index,
  isActive,
  isHighlighted,
  onItemRef,
  onPointerDown,
}: BottomNavItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      ref={(el) => onItemRef(index, el)}
      to={item.to}
      end={item.to === "/"}
      className={`bottom-nav-item${isHighlighted ? " is-highlighted" : ""}`}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      onPointerDown={onPointerDown}
    >
      <span className="bottom-nav-item-content">
        <span className="bottom-nav-icon-slot" aria-hidden>
          <Icon className="bottom-nav-icon" strokeWidth={isHighlighted ? 1.85 : 1.65} />
        </span>
        <span className="bottom-nav-label">{item.label}</span>
      </span>
    </NavLink>
  );
});

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeId = getActiveNavId(pathname);
  const activeIndex = Math.max(
    0,
    MAIN_NAV_ITEMS.findIndex((item) => item.id === activeId),
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const bubbleLayerRef = useRef<HTMLDivElement>(null);
  const bubbleAnimatingRef = useRef(false);
  const tabCentersRef = useRef<number[]>([]);
  const bubbleMetricsRef = useRef({ halfWidth: 0, inset: 0 });
  const previewIndexRef = useRef<number | null>(null);
  const bubbleX = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const skipAnimateRef = useRef(true);
  const skipNavAnimateRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const bubbleStartX = useRef(0);
  const lastDragHapticIndexRef = useRef(activeIndex);
  const prevActiveIndexRef = useRef(activeIndex);
  const bubbleFocusIndexRef = useRef(activeIndex);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [bubbleFocusIndex, setBubbleFocusIndex] = useState(activeIndex);
  const highlightedIndex = previewIndex ?? bubbleFocusIndex;

  const setBubbleAnimating = useCallback((active: boolean) => {
    if (bubbleAnimatingRef.current === active) return;
    bubbleAnimatingRef.current = active;
    bubbleLayerRef.current?.classList.toggle("bottom-nav-liquid-bubble--animating", active);
  }, []);

  const refreshBubbleMetrics = useCallback(() => {
    bubbleMetricsRef.current = {
      halfWidth: readCssRemVar("--bottom-nav-bubble-width") / 2,
      inset: readCssRemVar("--bottom-nav-bubble-inset"),
    };
  }, []);

  const refreshTabCenters = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      tabCentersRef.current = [];
      return;
    }

    const trackRect = track.getBoundingClientRect();
    tabCentersRef.current = MAIN_NAV_ITEMS.map((_, index) => {
      const item = itemRefs.current[index];
      if (!item) {
        return ((index + 0.5) / TAB_COUNT) * track.offsetWidth;
      }
      const rect = item.getBoundingClientRect();
      return rect.left - trackRect.left + rect.width / 2;
    });
  }, []);

  const refreshLayoutMetrics = useCallback(() => {
    refreshBubbleMetrics();
    refreshTabCenters();
  }, [refreshBubbleMetrics, refreshTabCenters]);

  const getTabCenters = useCallback((): number[] => tabCentersRef.current, []);

  const getBubbleTravelBounds = useCallback((trackWidth: number): { min: number; max: number } => {
    const { halfWidth, inset } = bubbleMetricsRef.current;
    const min = halfWidth + inset;
    const max = trackWidth - halfWidth - inset;
    return { min, max: Math.max(min, max) };
  }, []);

  const clampBubbleXForTrack = useCallback(
    (x: number, trackWidth: number): number => {
      const { min, max } = getBubbleTravelBounds(trackWidth);
      return Math.max(min, Math.min(max, x));
    },
    [getBubbleTravelBounds],
  );

  const getTabCenterX = useCallback(
    (index: number): number => {
      const centers = getTabCenters();
      return centers[index] ?? 0;
    },
    [getTabCenters],
  );

  const applyStretchFromPull = useCallback(
    (pull: number, tabSteps = 1) => {
      const { x, y } = stretchFromPull(pull, tabSteps);
      if (Math.abs(scaleX.get() - x) > STRETCH_EPSILON) {
        scaleX.set(x);
      }
      if (Math.abs(scaleY.get() - y) > STRETCH_EPSILON) {
        scaleY.set(y);
      }
    },
    [scaleX, scaleY],
  );

  const animateStretch = useCallback(
    (x: number, y: number, config: BubbleTransition = STRETCH_TWEEN) =>
      Promise.all([animate(scaleX, x, config), animate(scaleY, y, config)]),
    [scaleX, scaleY],
  );

  const animateBubbleX = useCallback(
    (target: number, fromIndex: number, toIndex: number) => {
      const tabSteps = getTabSteps(fromIndex, toIndex);
      const moveTransition = getMoveTransition(fromIndex, toIndex);
      const releaseTransition = getReleaseTransition(fromIndex, toIndex);
      const centers = getTabCenters();
      setBubbleAnimating(true);

      return animate(bubbleX, target, {
        ...moveTransition,
        onUpdate: (latest) => {
          applyStretchFromPull(Math.abs(latest - target), tabSteps);
          if (centers.length === 0) return;
          const nextFocus = indexFromX(latest, centers);
          if (nextFocus !== bubbleFocusIndexRef.current) {
            bubbleFocusIndexRef.current = nextFocus;
            setBubbleFocusIndex(nextFocus);
          }
        },
        onComplete: () => {
          bubbleFocusIndexRef.current = toIndex;
          setBubbleFocusIndex(toIndex);
          void animateStretch(1, 1, releaseTransition).finally(() => {
            setBubbleAnimating(false);
          });
        },
      });
    },
    [applyStretchFromPull, bubbleX, animateStretch, getTabCenters, setBubbleAnimating],
  );

  const syncBubbleToIndex = useCallback(
    (index: number, smooth = false, fromIndex = index) => {
      const track = trackRef.current;
      if (!track) return;

      refreshLayoutMetrics();
      const target = clampBubbleXForTrack(getTabCenterX(index), track.offsetWidth);

      if (smooth) {
        void animateBubbleX(target, fromIndex, index);
      } else {
        bubbleX.set(target);
        bubbleFocusIndexRef.current = index;
        setBubbleFocusIndex(index);
      }
    },
    [animateBubbleX, bubbleX, clampBubbleXForTrack, getTabCenterX, refreshLayoutMetrics],
  );

  useLayoutEffect(() => {
    refreshLayoutMetrics();
    syncBubbleToIndex(activeIndex, false);
    scaleX.set(1);
    scaleY.set(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncBubbleToIndex, refreshLayoutMetrics]);

  useEffect(() => {
    if (skipAnimateRef.current) {
      skipAnimateRef.current = false;
      prevActiveIndexRef.current = activeIndex;
      bubbleFocusIndexRef.current = activeIndex;
      setBubbleFocusIndex(activeIndex);
      return;
    }
    if (isDraggingRef.current) return;
    if (skipNavAnimateRef.current) {
      skipNavAnimateRef.current = false;
      prevActiveIndexRef.current = activeIndex;
      bubbleFocusIndexRef.current = activeIndex;
      setBubbleFocusIndex(activeIndex);
      return;
    }
    syncBubbleToIndex(activeIndex, true, prevActiveIndexRef.current);
    prevActiveIndexRef.current = activeIndex;
  }, [activeIndex, syncBubbleToIndex]);

  useEffect(() => {
    const onResize = () => {
      refreshLayoutMetrics();
      if (!isDraggingRef.current) syncBubbleToIndex(activeIndex, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, refreshLayoutMetrics, syncBubbleToIndex]);

  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    if (!isNearBubble(localX, localY, bubbleX.get(), rect.height)) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    dragStartX.current = event.clientX;
    bubbleStartX.current = bubbleX.get();
    lastDragHapticIndexRef.current = activeIndex;
    setBubbleAnimating(true);
    triggerHaptic("lightTap");
  };

  const onTrackPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !trackRef.current) return;

    const centers = getTabCenters();
    const trackWidth = trackRef.current.offsetWidth;
    const { min, max } = getBubbleTravelBounds(trackWidth);
    const delta = event.clientX - dragStartX.current;
    const nextX = Math.max(min, Math.min(max, bubbleStartX.current + delta));

    bubbleX.set(nextX);
    const nextPreviewIndex = indexFromX(nextX, centers);
    if (nextPreviewIndex !== previewIndexRef.current) {
      previewIndexRef.current = nextPreviewIndex;
      setPreviewIndex(nextPreviewIndex);
    }
    if (nextPreviewIndex !== lastDragHapticIndexRef.current) {
      lastDragHapticIndexRef.current = nextPreviewIndex;
      triggerHaptic("selection");
    }

    const anchor = centers[activeIndex] ?? getTabCenterX(activeIndex);
    applyStretchFromPull(Math.abs(nextX - anchor), getTabSteps(activeIndex, nextPreviewIndex));
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !trackRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDraggingRef.current = false;

    const centers = getTabCenters();
    const trackWidth = trackRef.current.offsetWidth;
    const nextIndex = indexFromX(bubbleX.get(), centers);
    const targetX = clampBubbleXForTrack(getTabCenterX(nextIndex), trackWidth);
    const target = MAIN_NAV_ITEMS[nextIndex];

    previewIndexRef.current = nextIndex;
    setPreviewIndex(nextIndex);

    void animateBubbleX(targetX, activeIndex, nextIndex).then(() => {
      previewIndexRef.current = null;
      setPreviewIndex(null);
      if (target && target.id !== activeId) {
        skipNavAnimateRef.current = true;
        navigate(target.to);
        return;
      }
      if (nextIndex === activeIndex) {
        triggerHaptic("lightTap");
      }
    });
  };

  const onNavItemPointerDown = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0) return;
    triggerHaptic("selection");
  };

  const onNavItemRef = useCallback((index: number, el: HTMLAnchorElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <div className="bottom-nav-shell">
        <div className="bottom-nav-panel">
          <div className="bottom-nav-bar" aria-hidden>
            <span className="bottom-nav-bar-rim" />
            <motion.div
              ref={bubbleLayerRef}
              className="bottom-nav-liquid-bubble"
              style={{
                x: bubbleX,
                scaleX,
                scaleY,
              }}
              aria-hidden
            >
              <span className="bottom-nav-liquid-bubble-glass" />
              <span className="bottom-nav-liquid-bubble-ring" />
            </motion.div>
          </div>

          <div
            ref={trackRef}
            className="bottom-nav-track"
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            {MAIN_NAV_ITEMS.map((item, index) => (
              <BottomNavItem
                key={item.id}
                item={item}
                index={index}
                isActive={activeId === item.id}
                isHighlighted={index === highlightedIndex}
                onItemRef={onNavItemRef}
                onPointerDown={onNavItemPointerDown}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
