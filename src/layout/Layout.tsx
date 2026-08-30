import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import {
  PageRefreshProvider,
  CardCatalogProvider,
  FavoriteDecksProvider,
  useGlobalButtonHaptics,
  useDisableSystemGestures,
  useHapticSettingsBootstrap,
  useLinkedTagSync,
  useUserDataBootstrap,
} from "@/hooks";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { PerfProvider, PerfDevOverlay } from "@/perf";
import { PageEnter } from "@/motion";
import {
  bindTelegramViewportListeners,
  bootstrapTelegramViewport,
} from "@/utils/telegramViewport";
import { bindTelegramAuthListeners } from "@/utils/telegramAuth";

export function Layout() {
  useGlobalButtonHaptics();
  useDisableSystemGestures();
  useHapticSettingsBootstrap();
  useLinkedTagSync();
  useUserDataBootstrap();

  useEffect(() => {
    bootstrapTelegramViewport();
    const offViewport = bindTelegramViewportListeners();
    const offAuth = bindTelegramAuthListeners();
    return () => {
      offViewport();
      offAuth();
    };
  }, []);

  return (
    <PerfProvider>
      <div className="min-h-screen flex overflow-x-hidden app-shell">
        <Sidebar />

        <main className="app-main">
          <PageRefreshProvider>
            <CardCatalogProvider>
              <FavoriteDecksProvider>
                <div className="page-shell">
                  <ErrorBoundary>
                    <PageEnter />
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
