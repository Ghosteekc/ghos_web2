import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TelegramWebApp } from "@/vite-env";
import { haptic, type HapticImpact } from "@/utils/hapticManager";
export { PageRefreshProvider, usePageRefresh } from "./PageRefreshProvider";
export { CardCatalogProvider, useCardCatalog } from "./CardCatalogProvider";
export { FavoriteDecksProvider, useFavoriteDecks } from "./FavoriteDecksProvider";
export { usePullToRefresh } from "./usePullToRefresh";
export { useGlobalButtonHaptics } from "./useGlobalButtonHaptics";
export { useHapticSettingsBootstrap } from "./useHapticSettingsBootstrap";
export { useSettings } from "./useSettings";
export { applyTheme, loadStoredTheme, resolveTheme, initTheme } from "./useTheme";
export type { AppTheme } from "./useTheme";
export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);
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
    openLink: (url: string) => {
      const webApp = tg as (TelegramWebApp & { openLink?: (u: string) => void }) | null;
      if (webApp?.openLink) {
        webApp.openLink(url);
      } else {
        window.open(url, "_blank");
      }
    },
    hapticFeedback: (style: HapticImpact) => {
      if (style === "heavy") haptic.heavy();
      else if (style === "medium") haptic.medium();
      else haptic.light();
    },
    showAlert: (message: string) => tg?.showAlert(message),
    showConfirm: (message: string) => tg?.showConfirm(message),
  };
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