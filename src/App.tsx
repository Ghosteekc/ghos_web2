import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { Loader } from "@/components/ui";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StartupScreen } from "@/components/startup/StartupScreen";

const loadAnalyticsPage = () =>
  import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }));
const loadDecksPage = () =>
  import("@/pages/DecksPage").then((m) => ({ default: m.DecksPage }));
const loadBattlesPage = () =>
  import("@/pages/BattlesPage").then((m) => ({ default: m.BattlesPage }));

const AnalyticsPage = lazy(loadAnalyticsPage);
const DecksPage = lazy(loadDecksPage);
const BattlesPage = lazy(loadBattlesPage);
const ProfileCardsPage = lazy(() => import("@/pages/ProfileCardsPage"));
const ProfileMasteryPage = lazy(() => import("@/pages/ProfileMasteryPage"));
const DeckComparePage = lazy(() => import("@/pages/DeckComparePage"));
const MineDeckStatsPage = lazy(() => import("@/pages/MineDeckStatsPage"));
const BattleDetailPage = lazy(() => import("@/pages/BattleDetailPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const PlayerPreviewPage = lazy(() => import("@/pages/PlayerPreviewPage"));
const AiCoachPage = lazy(() => import("@/pages/AiCoachPage"));
const ProPage = lazy(() => import("@/pages/ProPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  const [startupVisible, setStartupVisible] = useState(true);
  const [startupMinimumElapsed, setStartupMinimumElapsed] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const markStartupMinimumElapsed = useCallback(() => setStartupMinimumElapsed(true), []);
  const markProfileReady = useCallback(() => setProfileReady(true), []);

  useEffect(() => {
    // ProfilePage is already mounted beneath the startup overlay and starts its
    // data request immediately. Warm the primary route chunks shortly after
    // that first paint, so their first navigation does not wait on code-split JS.
    const timer = window.setTimeout(() => {
      void Promise.all([loadAnalyticsPage(), loadDecksPage(), loadBattlesPage()]).catch(() => undefined);
    }, 180);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!startupMinimumElapsed || !profileReady) return;
    setStartupVisible(false);
  }, [profileReady, startupMinimumElapsed]);

  return (
    <>
    <motion.div
      className="app-boot-content"
      initial={false}
      animate={{ opacity: startupVisible ? 0 : 1 }}
      transition={{ duration: 0.22, ease: [0.22, 0.08, 0.24, 1] }}
    >
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProfilePage onInitialLoadComplete={markProfileReady} />} />
          <Route path="profile" element={<Navigate to="/" replace />} />
          <Route path="search" element={<Navigate to="/profile/search" replace />} />
          <Route
            path="profile/cards"
            element={
              <LazyPage>
                <ProfileCardsPage />
              </LazyPage>
            }
          />
          <Route
            path="profile/mastery"
            element={
              <LazyPage>
                <ProfileMasteryPage />
              </LazyPage>
            }
          />
          <Route
            path="pro"
            element={
              <LazyPage>
                <ProPage />
              </LazyPage>
            }
          />
          <Route
            path="analytics"
            element={
              <LazyPage>
                <AnalyticsPage />
              </LazyPage>
            }
          />
          <Route
            path="ai"
            element={
              <LazyPage>
                <AiCoachPage />
              </LazyPage>
            }
          />
          <Route
            path="decks/compare"
            element={
              <LazyPage>
                <DeckComparePage />
              </LazyPage>
            }
          />
          <Route
            path="decks/mine/stats"
            element={
              <LazyPage>
                <MineDeckStatsPage />
              </LazyPage>
            }
          />
          <Route
            path="decks"
            element={
              <LazyPage>
                <DecksPage />
              </LazyPage>
            }
          />
          <Route
            path="battles"
            element={
              <LazyPage>
                <BattlesPage />
              </LazyPage>
            }
          />
          <Route
            path="battles/t/:battleTime"
            element={
              <LazyPage>
                <BattleDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="battles/:index"
            element={
              <LazyPage>
                <BattleDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="profile/search"
            element={
              <LazyPage>
                <SearchPage />
              </LazyPage>
            }
          />
          <Route path="favorites" element={<Navigate to="/decks?tab=favorites" replace />} />
          <Route
            path="player/:tag"
            element={
              <LazyPage>
                <PlayerPreviewPage />
              </LazyPage>
            }
          />
          <Route path="more" element={<Navigate to="/" replace />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </motion.div>
    <AnimatePresence>
      {startupVisible ? <StartupScreen onComplete={markStartupMinimumElapsed} /> : null}
    </AnimatePresence>
    </>
  );
}
