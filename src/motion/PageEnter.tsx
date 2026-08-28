import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useEnterMotionConfig } from "./useEnterMotionConfig";

/** Лёгкий enter при смене route (opacity, без translate на mobile). */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const motionConfig = useEnterMotionConfig();

  return (
    <motion.div
      key={pathname}
      className="page-motion-panel"
      initial={motionConfig.initial}
      animate={motionConfig.animate}
      transition={{
        ...motionConfig.transition,
        duration: motionConfig.fadeOnly ? 0.18 : 0.24,
      }}
    >
      {children}
    </motion.div>
  );
}
