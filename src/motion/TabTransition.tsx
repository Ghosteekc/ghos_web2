import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import { useEnterMotionConfig } from "./useEnterMotionConfig";

interface TabTransitionProps {
  /** Уникальный ключ вкладки — remount + enter animation. */
  tabKey: string;
  children: ReactNode;
  className?: string;
}

/** Fade при смене вкладки внутри страницы (Framer — надёжный restart на mobile WebView). */
export function TabTransition({ tabKey, children, className }: TabTransitionProps) {
  const motionConfig = useEnterMotionConfig();

  return (
    <motion.div
      key={tabKey}
      className={cn("tab-motion-panel", className)}
      initial={motionConfig.initial}
      animate={motionConfig.animate}
      transition={motionConfig.transition}
    >
      {children}
    </motion.div>
  );
}

/** Enter после lazy/Suspense — монтируется вместе с контентом панели. */
export function TabContentEnter({ children, className }: { children: ReactNode; className?: string }) {
  const motionConfig = useEnterMotionConfig();

  return (
    <motion.div
      className={cn("tab-motion-panel", className)}
      initial={motionConfig.initial}
      animate={motionConfig.animate}
      transition={motionConfig.transition}
    >
      {children}
    </motion.div>
  );
}
