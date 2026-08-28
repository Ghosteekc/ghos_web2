import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { usePageMotionConfig } from "./usePageMotionConfig";

/** Crossfade при смене route (bottom nav и вложенные страницы). */
export function PageEnter() {
  const location = useLocation();
  const outlet = useOutlet();
  const motionConfig = usePageMotionConfig();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".app-main")?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="page-motion-stage">
      <AnimatePresence mode="popLayout" initial={false}>
        {outlet ? (
          <motion.div
            key={location.pathname}
            className="page-motion-panel"
            initial={motionConfig.initial}
            animate={motionConfig.animate}
            exit={motionConfig.exit}
            transition={motionConfig.transition}
          >
            {outlet}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
