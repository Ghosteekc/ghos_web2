import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { animate, motion, useMotionValue } from "framer-motion";
import { triggerHaptic } from "@/utils/hapticManager";
import { MAIN_NAV_ITEMS, getActiveNavId } from "./navigation";

const TAB_COUNT = MAIN_NAV_ITEMS.length;
const BUBBLE_HIT_X = 58;
const BUBBLE_HIT_Y = 50;

const STRETCH_TWEEN = { type: "tween" as const, duration: 0.18, ease: [0.22, 0.08, 0.24, 1] as const };
const NEAR_TAB_TWEEN = { type: "tween" as const, duration: 0.24, ease: [0.33, 0.08, 0.25, 1] as const };

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

function readCssRemVar(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  if (raw.endsWith("rem")) return parseFloat(raw) * rootFontSize;
  if (raw.endsWith("px")) return parseFloat(raw);
  return parseFloat(raw) || 0;
}

function getBubbleTravelBounds(trackWidth: number): { min: number; max: number } {
  const half = readCssRemVar("--bottom-nav-bubble-width") / 2;
  const inset = readCssRemVar("--bottom-nav-bubble-inset");
  const min = half + inset;
  const max = trackWidth - half - inset;
  return { min, max: Math.max(min, max) };
}

function clampBubbleX(x: number, trackWidth: number): number {
  const { min, max } = getBubbleTravelBounds(trackWidth);
  return Math.max(min, Math.min(max, x));
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
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const highlightedIndex = previewIndex ?? activeIndex;

  const getTabCenters = useCallback((): number[] => {
    const track = trackRef.current;
    if (!track) return [];

    const trackRect = track.getBoundingClientRect();
    return MAIN_NAV_ITEMS.map((_, index) => {
      const item = itemRefs.current[index];
      if (!item) {
        return ((index + 0.5) / TAB_COUNT) * track.offsetWidth;
      }
      const rect = item.getBoundingClientRect();
      return rect.left - trackRect.left + rect.width / 2;
    });
  }, []);

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
      scaleX.set(x);
      scaleY.set(y);
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

      return animate(bubbleX, target, {
        ...moveTransition,
        onUpdate: (latest) => applyStretchFromPull(Math.abs(latest - target), tabSteps),
        onComplete: () => {
          void animateStretch(1, 1, releaseTransition);
        },
      });
    },
    [applyStretchFromPull, bubbleX, animateStretch],
  );

  const syncBubbleToIndex = useCallback(
    (index: number, smooth = false, fromIndex = index) => {
      const track = trackRef.current;
      if (!track) return;

      const target = clampBubbleX(getTabCenterX(index), track.offsetWidth);

      if (smooth) {
        void animateBubbleX(target, fromIndex, index);
      } else {
        bubbleX.set(target);
      }
    },
    [animateBubbleX, bubbleX, getTabCenterX],
  );

  useLayoutEffect(() => {
    syncBubbleToIndex(activeIndex, false);
    scaleX.set(1);
    scaleY.set(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncBubbleToIndex]);

  useEffect(() => {
    if (skipAnimateRef.current) {
      skipAnimateRef.current = false;
      prevActiveIndexRef.current = activeIndex;
      return;
    }
    if (isDraggingRef.current) return;
    if (skipNavAnimateRef.current) {
      skipNavAnimateRef.current = false;
      prevActiveIndexRef.current = activeIndex;
      return;
    }
    syncBubbleToIndex(activeIndex, true, prevActiveIndexRef.current);
    prevActiveIndexRef.current = activeIndex;
  }, [activeIndex, syncBubbleToIndex]);

  useEffect(() => {
    const onResize = () => {
      if (!isDraggingRef.current) syncBubbleToIndex(activeIndex, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, syncBubbleToIndex]);

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
    setPreviewIndex(nextPreviewIndex);
    if (nextPreviewIndex !== lastDragHapticIndexRef.current) {
      lastDragHapticIndexRef.current = nextPreviewIndex;
      triggerHaptic("selection");
    }

    const anchor = getTabCenterX(activeIndex);
    const { x, y } = stretchFromPull(Math.abs(nextX - anchor));
    void animateStretch(x, y);
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
    const targetX = clampBubbleX(getTabCenterX(nextIndex), trackWidth);
    const target = MAIN_NAV_ITEMS[nextIndex];

    setPreviewIndex(nextIndex);

    void animateBubbleX(targetX, activeIndex, nextIndex).then(() => {
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

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <div className="bottom-nav-shell">
        <div className="bottom-nav-panel">
          <div className="bottom-nav-bar" aria-hidden>
            <span className="bottom-nav-bar-rim" />
            <motion.div
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
            {MAIN_NAV_ITEMS.map((item, index) => {
              const isActive = activeId === item.id;
              const isHighlighted = index === highlightedIndex;
              return (
                <NavLink
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  to={item.to}
                  end={item.to === "/"}
                  className={`bottom-nav-item${isHighlighted ? " is-highlighted" : ""}`}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onPointerDown={onNavItemPointerDown}
                >
                  <span className="bottom-nav-item-content">
                    <span className="bottom-nav-icon-slot" aria-hidden>
                      <item.icon
                        className="bottom-nav-icon"
                        strokeWidth={isHighlighted ? 1.85 : 1.65}
                      />
                    </span>
                    <span className="bottom-nav-label">{item.label}</span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
