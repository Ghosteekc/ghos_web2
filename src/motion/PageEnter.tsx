import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { notifyPerfTransitionStart } from "@/perf/motionSample";

/**
 * Плавное появление при смене route (bottom nav и вложенные страницы).
 * Только enter (без exit) — легче для WebView и одинаково заметно везде.
 */
export function PageEnter() {
  const location = useLocation();
  const outlet = useOutlet();
  const initialPathRef = useRef(location.pathname);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".app-main")?.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (initialPathRef.current === location.pathname) return;
    notifyPerfTransitionStart();
  }, [location.pathname]);

  if (!outlet) return null;

  return (
    <div className="page-motion-stage">
      <div
        // Query params switch tabs in-place; only a pathname change is a page transition.
        key={location.pathname}
        className="page-motion-panel page-enter"
      >
        {outlet}
      </div>
    </div>
  );
}
