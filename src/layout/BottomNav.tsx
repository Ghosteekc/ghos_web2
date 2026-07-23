import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { animate, motion, useMotionValue } from "framer-motion";
import { triggerHaptic } from "@/utils/hapticManager";
import { MAIN_NAV_ITEMS, getActiveNavId } from "./navigation";

const TAB_COUNT = MAIN_NAV_ITEMS.length;
const BUBBLE_HIT_X = 58;
const BUBBLE_HIT_Y = 50;

const MOVE_SPRING = { type: "spring" as const, stiffness: 210, damping: 28, mass: 0.85 };
const RELEASE_SPRING = { type: "spring" as const, stiffness: 165, damping: 22, mass: 1.05 };
const STRETCH_TWEEN = { type: "tween" as const, duration: 0.24, ease: [0.22, 0.08, 0.24, 1] as const };

type BubbleTransition = typeof MOVE_SPRING | typeof RELEASE_SPRING | typeof STRETCH_TWEEN;

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

  const animateBubbleX = useCallback(
    (target: number, config: BubbleTransition = MOVE_SPRING) => animate(bubbleX, target, config),
    [bubbleX],
  );

  const animateStretch = useCallback(
    (x: number, y: number, config: BubbleTransition = STRETCH_TWEEN) =>
      Promise.all([animate(scaleX, x, config), animate(scaleY, y, config)]),
    [scaleX, scaleY],
  );

  const resetStretch = useCallback(
    () => animateStretch(1, 1, RELEASE_SPRING),
    [animateStretch],
  );

  const syncBubbleToIndex = useCallback(
    (index: number, smooth = false) => {
      const target = getTabCenterX(index);
      if (!target) return;

      if (smooth) {
        void animateBubbleX(target, MOVE_SPRING);
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
      return;
    }
    if (isDraggingRef.current) return;
    if (skipNavAnimateRef.current) {
      skipNavAnimateRef.current = false;
      return;
    }
    syncBubbleToIndex(activeIndex, true);
    void resetStretch();
  }, [activeIndex, resetStretch, syncBubbleToIndex]);

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
    const minX = centers[0] ?? 0;
    const maxX = centers[centers.length - 1] ?? trackRef.current.offsetWidth;
    const delta = event.clientX - dragStartX.current;
    const nextX = Math.max(minX, Math.min(maxX, bubbleStartX.current + delta));

    bubbleX.set(nextX);
    const nextPreviewIndex = indexFromX(nextX, centers);
    setPreviewIndex(nextPreviewIndex);
    if (nextPreviewIndex !== lastDragHapticIndexRef.current) {
      lastDragHapticIndexRef.current = nextPreviewIndex;
      triggerHaptic("selection");
    }

    const anchor = getTabCenterX(activeIndex);
    const pull = Math.abs(nextX - anchor);
    void animateStretch(
      1 + Math.min(pull / 80, 0.18),
      Math.max(0.92, 1 - Math.min(pull / 200, 0.06)),
    );
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !trackRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDraggingRef.current = false;

    const centers = getTabCenters();
    const nextIndex = indexFromX(bubbleX.get(), centers);
    const targetX = getTabCenterX(nextIndex);
    const target = MAIN_NAV_ITEMS[nextIndex];

    setPreviewIndex(nextIndex);

    void Promise.all([animateBubbleX(targetX, RELEASE_SPRING), resetStretch()]).then(() => {
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
          </div>

          <div
            ref={trackRef}
            className="bottom-nav-track"
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
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
                  <item.icon
                    className="bottom-nav-icon"
                    strokeWidth={isHighlighted ? 1.9 : 1.65}
                    aria-hidden
                  />
                  <span className="bottom-nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
