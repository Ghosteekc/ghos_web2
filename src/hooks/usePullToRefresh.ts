import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/utils/hapticManager";

const PULL_THRESHOLD = 64;
const PULL_MAX = 112;

function getScrollTop(): number {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false;
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const armedHaptic = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  const setPull = useCallback((value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  }, []);

  useEffect(() => {
    if (!enabled) {
      pulling.current = false;
      startY.current = 0;
      setPull(0);
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (getScrollTop() > 1) {
        pulling.current = false;
        startY.current = 0;
        return;
      }
      pulling.current = true;
      startY.current = e.touches[0]?.clientY ?? 0;
      armedHaptic.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current || startY.current <= 0) return;
      if (getScrollTop() > 1) {
        pulling.current = false;
        setPull(0);
        return;
      }

      const delta = (e.touches[0]?.clientY ?? 0) - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }

      // Rubber-band: easier at first, harder near max.
      const dampened = Math.min(PULL_MAX, delta * 0.55);
      setPull(dampened);

      if (dampened >= PULL_THRESHOLD && !armedHaptic.current) {
        armedHaptic.current = true;
        haptic.light();
      } else if (dampened < PULL_THRESHOLD * 0.85) {
        armedHaptic.current = false;
      }

      // Keep the gesture from scrolling the page while pulling.
      if (dampened > 8 && e.cancelable) {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = 0;

      const distance = pullDistanceRef.current;
      setPull(0);

      if (distance < PULL_THRESHOLD || refreshingRef.current) return;

      setRefreshing(true);
      refreshingRef.current = true;
      haptic.medium();
      void (async () => {
        try {
          await onRefreshRef.current();
        } finally {
          setRefreshing(false);
          refreshingRef.current = false;
        }
      })();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, setPull]);

  return { refreshing, pullDistance, threshold: PULL_THRESHOLD };
}

export { PULL_THRESHOLD, PULL_MAX };
