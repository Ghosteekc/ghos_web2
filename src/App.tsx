import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { Loader } from "@/components/ui";

const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ProfileCardsPage = lazy(() => import("@/pages/ProfileCardsPage"));
const ProfileMasteryPage = lazy(() => import("@/pages/ProfileMasteryPage"));
const Analytics = lazy(() => import("@/pages/AnalyticsPage"));
const DecksPage = lazy(() => import("@/pages/DecksPage"));
const DeckComparePage = lazy(() => import("@/pages/DeckComparePage"));
const MineDeckStatsPage = lazy(() => import("@/pages/MineDeckStatsPage"));
const BattlesPage = lazy(() => import("@/pages/BattlesPage"));
const BattleDetailPage = lazy(() => import("@/pages/BattleDetailPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
const PlayerPreviewPage = lazy(() => import("@/pages/PlayerPreviewPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route path="profile" element={<Navigate to="/" replace />} />
          <Route
            path="profile/cards"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfileCardsPage />
              </Suspense>
            }
          />
          <Route
            path="profile/mastery"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfileMasteryPage />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route
            path="decks/compare"
            element={
              <Suspense fallback={<PageLoader />}>
                <DeckComparePage />
              </Suspense>
            }
          />
          <Route
            path="decks/mine/stats"
            element={
              <Suspense fallback={<PageLoader />}>
                <MineDeckStatsPage />
              </Suspense>
            }
          />
          <Route
            path="decks"
            element={
              <Suspense fallback={<PageLoader />}>
                <DecksPage />
              </Suspense>
            }
          />
          <Route
            path="battles"
            element={
              <Suspense fallback={<PageLoader />}>
                <BattlesPage />
              </Suspense>
            }
          />
          <Route
            path="battles/t/:battleTime"
            element={
              <Suspense fallback={<PageLoader />}>
                <BattleDetailPage />
              </Suspense>
            }
          />
          <Route
            path="battles/:index"
            element={
              <Suspense fallback={<PageLoader />}>
                <BattleDetailPage />
              </Suspense>
            }
          />
          <Route
            path="search"
            element={
              <Suspense fallback={<PageLoader />}>
                <SearchPage />
              </Suspense>
            }
          />
          <Route
            path="favorites"
            element={
              <Suspense fallback={<PageLoader />}>
                <FavoritesPage />
              </Suspense>
            }
          />
          <Route
            path="player/:tag"
            element={
              <Suspense fallback={<PageLoader />}>
                <PlayerPreviewPage />
              </Suspense>
            }
          />
          <Route path="more" element={<Navigate to="/search" replace />} />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}