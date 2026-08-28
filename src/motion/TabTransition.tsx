import type { ReactNode } from "react";

interface TabTransitionProps {
  /** Уникальный ключ вкладки — remount + enter animation. */
  tabKey: string;
  children: ReactNode;
  className?: string;
}

/** Быстрый fade + translateY при смене вкладки внутри страницы. */
export function TabTransition({ tabKey, children, className }: TabTransitionProps) {
  return (
    <div key={tabKey} className={className ? `tab-enter ${className}` : "tab-enter"}>
      {children}
    </div>
  );
}
