import { useLayoutEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";

/**
 * Плавное появление при смене route (bottom nav и вложенные страницы).
 * Только enter (без exit) — легче для WebView и одинаково заметно везде.
 */
export function PageEnter() {
  const location = useLocation();
  const outlet = useOutlet();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".app-main")?.scrollTo(0, 0);
  }, [location.pathname]);

  if (!outlet) return null;

  return (
    <div className="page-motion-stage">
      <div
        key={location.key}
        className="page-motion-panel page-enter"
      >
        {outlet}
      </div>
    </div>
  );
}
