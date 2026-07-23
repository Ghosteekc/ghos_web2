import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { PageRefreshProvider, CardCatalogProvider, FavoriteDecksProvider, useGlobalButtonHaptics, useHapticSettingsBootstrap } from "@/hooks";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

function getTelegramChromeTop(webApp: NonNullable<typeof window.Telegram>["WebApp"]) {
  if (webApp.platform === "ios") return 56;
  if (webApp.platform === "android") return 48;
  return 44;
}

function applyTelegramSafeArea() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  const root = document.documentElement;
  const device = webApp.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const content = webApp.contentSafeAreaInset;

  root.style.setProperty("--tg-device-safe-top", `${device.top}px`);
  root.style.setProperty("--tg-device-safe-bottom", `${device.bottom}px`);
  root.style.setProperty("--tg-device-safe-left", `${device.left}px`);
  root.style.setProperty("--tg-device-safe-right", `${device.right}px`);

  const chromeTop = getTelegramChromeTop(webApp);
  let contentTop = content?.top ?? 0;
  const contentBottom = content?.bottom ?? device.bottom;
  const contentLeft = content?.left ?? device.left;
  const contentRight = content?.right ?? device.right;

  contentTop = Math.max(contentTop, device.top + chromeTop);

  root.style.setProperty("--tg-content-safe-top", `${contentTop}px`);
  root.style.setProperty("--tg-content-safe-bottom", `${contentBottom}px`);
  root.style.setProperty("--tg-content-safe-left", `${contentLeft}px`);
  root.style.setProperty("--tg-content-safe-right", `${contentRight}px`);
}

export function Layout() {
  useGlobalButtonHaptics();
  useHapticSettingsBootstrap();

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
    applyTelegramSafeArea();
    if (!webApp) return;

    webApp.onEvent?.("safeAreaChanged", applyTelegramSafeArea);
    webApp.onEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
    return () => {
      webApp.offEvent?.("safeAreaChanged", applyTelegramSafeArea);
      webApp.offEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
    };
  }, []);

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <Sidebar />

      <main className="app-main">
        <PageRefreshProvider>
          <CardCatalogProvider>
            <FavoriteDecksProvider>
              <div className="page-shell">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </FavoriteDecksProvider>
          </CardCatalogProvider>
        </PageRefreshProvider>
      </main>

      <BottomNav />
    </div>
  );
}
