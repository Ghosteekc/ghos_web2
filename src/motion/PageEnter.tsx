import { motion } from "framer-motion";
import { useLayoutEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { useEnterMotionConfig } from "./useEnterMotionConfig";

/**
 * Плавное появление при смене route (bottom nav и вложенные страницы).
 * Только enter (без exit) — легче для WebView и одинаково заметно везде.
 */
export function PageEnter() {
  const location = useLocation();
  const outlet = useOutlet();
  const motionConfig = useEnterMotionConfig();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".app-main")?.scrollTo(0, 0);
  }, [location.pathname]);

  if (!outlet) return null;

  return (
    <div className="page-motion-stage">
      <motion.div
        key={location.pathname}
        className="page-motion-panel"
        initial={motionConfig.initial}
        animate={motionConfig.animate}
        transition={motionConfig.transition}
      >
        {outlet}
      </motion.div>
    </div>
  );
}
