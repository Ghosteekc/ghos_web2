import { createContext, useContext, useEffect, useId } from "react";

export type TabLoaderRegistry = (id: string, active: boolean) => void;

/**
 * A tab handoff owns the visible mascot. Nested async panels register their
 * real loading lifetime here, so the handoff does not finish before a lazy
 * chunk or request is actually ready.
 */
export const TabLoadingContext = createContext<TabLoaderRegistry | null>(null);

export function useTabLoaderRegistration(active = true): void {
  const register = useContext(TabLoadingContext);
  const id = useId();

  useEffect(() => {
    if (!register || !active) return;
    register(id, true);
    return () => register(id, false);
  }, [active, id, register]);
}
