import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TelegramWebApp } from "@/vite-env";

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);
      webApp.ready();
      webApp.expand();
      setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, []);

  return {
    tg,
    isReady,
    theme: tg?.colorScheme ?? "dark",
    themeParams: tg?.themeParams ?? {},
    initData: tg?.initData ?? "",
    initDataUnsafe: tg?.initDataUnsafe ?? {},
    user: tg?.initDataUnsafe?.user,
    openTelegramLink: (path: string) => tg?.openTelegramLink(`https://t.me/${path}`),
    hapticFeedback: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => {
      tg?.HapticFeedback?.impactOccurred(style);
    },
    showAlert: (message: string) => tg?.showAlert(message),
    showConfirm: (message: string) => tg?.showConfirm(message),
  };
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current > 0 && window.scrollY === 0) {
      currentY.current = e.touches[0].clientY - startY.current;
      if (currentY.current > 0) {
        setPullDistance(Math.min(currentY.current, 120));
      }
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  }, [pullDistance, refreshing, onRefresh]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { refreshing, pullDistance };
}

export function useAnimatedNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const direction = useRef(1);

  useEffect(() => {
    const pathname = location.pathname;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 1) {
      direction.current = 1;
    } else {
      direction.current = -1;
    }
  }, [location]);

  return { navigate, direction: direction.current, location };
}