import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import {
  PageRefreshProvider,
  CardCatalogProvider,
  FavoriteDecksProvider,
  useGlobalButtonHaptics,
  useHapticSettingsBootstrap,
} from "@/hooks";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { PerfProvider, PerfDevOverlay } from "@/perf";
import {
  bindTelegramViewportListeners,
  bootstrapTelegramViewport,
} from "@/utils/telegramViewport";

export function Layout() {
  useGlobalButtonHaptics();
  useHapticSettingsBootstrap();

  useEffect(() => {
    bootstrapTelegramViewport();
    return bindTelegramViewportListeners();
  }, []);

  return (
    <PerfProvider>
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
        {import.meta.env.DEV ? <PerfDevOverlay /> : null}
      </div>
    </PerfProvider>
  );
}
