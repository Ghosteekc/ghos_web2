import type { ReactNode } from "react";
import { cn } from "@/utils";

interface TabTransitionProps {
  /** Уникальный ключ вкладки — remount + enter animation. */
  tabKey: string;
  children: ReactNode;
  className?: string;
}

/** Fade при смене вкладки внутри страницы (Framer — надёжный restart на mobile WebView). */
export function TabTransition({ tabKey, children, className }: TabTransitionProps) {
  return (
    <div
      key={tabKey}
      className={cn("tab-motion-panel", "tab-enter", className)}
    >
      {children}
    </div>
  );
}

/** Enter после lazy/Suspense — монтируется вместе с контентом панели. */
export function TabContentEnter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("tab-motion-panel", "tab-enter", className)}
    >
      {children}
    </div>
  );
}
