import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MenuNavHint } from "./MenuNavHint";
import { Menu, X } from "lucide-react";
import { cn } from "@/utils";
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

  // Всегда ниже шапки Telegram («Закрыть» / меню)
  contentTop = Math.max(contentTop, device.top + chromeTop);

  root.style.setProperty("--tg-content-safe-top", `${contentTop}px`);
  root.style.setProperty("--tg-content-safe-bottom", `${contentBottom}px`);
  root.style.setProperty("--tg-content-safe-left", `${contentLeft}px`);
  root.style.setProperty("--tg-content-safe-right", `${contentRight}px`);
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();

  useGlobalButtonHaptics();
  useHapticSettingsBootstrap();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen && !isDesktop ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, isDesktop]);

  const sidebarOpen = isDesktop || mobileOpen;
  const showMenuHint = location.pathname === "/" && !isDesktop && !mobileOpen;

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <div
        className={cn("sidebar-overlay", mobileOpen && !isDesktop && "open")}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen || isDesktop}
      />

      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-burger lg:hidden"
        aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-cr-text" />
        ) : (
          <Menu className="w-6 h-6 text-cr-text" />
        )}
      </button>

      <MenuNavHint visible={showMenuHint} />

      <Sidebar isOpen={sidebarOpen} onClose={() => setMobileOpen(false)} />

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
    </div>
  );
}
