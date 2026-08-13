import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { PullToRefreshIndicator } from "@/components/ui/PullToRefreshIndicator";
import { usePullToRefresh } from "./usePullToRefresh";

type HandlerApi = {
  register: (token: object, fn: () => Promise<void>) => void;
  unregister: (token: object) => void;
};

const PageRefreshApiContext = createContext<MutableRefObject<HandlerApi> | null>(null);

function isAiChatPath(pathname: string): boolean {
  return pathname === "/ai" || pathname.startsWith("/ai/");
}

/**
 * Pull-to-refresh вызывает все зарегистрированные обработчики текущей страницы
 * (и вложенных панелей через usePageRefresh).
 * На чате Ghosteek AI жест отключён.
 */
export function PageRefreshProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const ptrEnabled = !isAiChatPath(location.pathname);
  const handlersRef = useRef(new Map<object, () => Promise<void>>());

  const handleRefresh = useCallback(async () => {
    const handlers = [...handlersRef.current.values()];
    if (!handlers.length) return;
    await Promise.all(handlers.map((fn) => fn()));
  }, []);

  const { refreshing, pullDistance, threshold } = usePullToRefresh(handleRefresh, {
    enabled: ptrEnabled,
  });

  const apiRef = useRef<HandlerApi>({
    register: (token, fn) => {
      handlersRef.current.set(token, fn);
    },
    unregister: (token) => {
      handlersRef.current.delete(token);
    },
  });

  useEffect(() => {
    const onSync = () => {
      void handleRefresh();
    };
    window.addEventListener("app:sync", onSync);
    return () => window.removeEventListener("app:sync", onSync);
  }, [handleRefresh]);

  return (
    <PageRefreshApiContext.Provider value={apiRef}>
      {ptrEnabled ? (
        <PullToRefreshIndicator
          refreshing={refreshing}
          pullDistance={pullDistance}
          threshold={threshold}
        />
      ) : null}
      {children}
    </PageRefreshApiContext.Provider>
  );
}

export function usePageRefresh(onRefresh: () => Promise<void>) {
  const apiRef = useContext(PageRefreshApiContext);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const tokenRef = useRef<object>({});

  useEffect(() => {
    if (!apiRef) return;
    const token = tokenRef.current;
    const run = async () => {
      await onRefreshRef.current();
    };
    apiRef.current.register(token, run);
    return () => apiRef.current.unregister(token);
  }, [apiRef]);
}
