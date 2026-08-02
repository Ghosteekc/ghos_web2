import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { Loader } from "@/components/ui";
import { ProfilePage } from "@/pages/ProfilePage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { DecksPage } from "@/pages/DecksPage";
import { BattlesPage } from "@/pages/BattlesPage";
import { SettingsPage } from "@/pages/SettingsPage";

const ProfileCardsPage = lazy(() => import("@/pages/ProfileCardsPage"));
const ProfileMasteryPage = lazy(() => import("@/pages/ProfileMasteryPage"));
const DeckComparePage = lazy(() => import("@/pages/DeckComparePage"));
const MineDeckStatsPage = lazy(() => import("@/pages/MineDeckStatsPage"));
const BattleDetailPage = lazy(() => import("@/pages/BattleDetailPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const PlayerPreviewPage = lazy(() => import("@/pages/PlayerPreviewPage"));
const AiCoachPage = lazy(() => import("@/pages/AiCoachPage"));

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
          <Route index element={<ProfilePage />} />
          <Route path="profile" element={<Navigate to="/" replace />} />
          <Route path="search" element={<Navigate to="/profile/search" replace />} />
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
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="ai"
            element={
              <Suspense fallback={<PageLoader />}>
                <AiCoachPage />
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
          <Route path="decks" element={<DecksPage />} />
          <Route path="battles" element={<BattlesPage />} />
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
            path="profile/search"
            element={
              <Suspense fallback={<PageLoader />}>
                <SearchPage />
              </Suspense>
            }
          />
          <Route path="favorites" element={<Navigate to="/decks?tab=favorites" replace />} />
          <Route
            path="player/:tag"
            element={
              <Suspense fallback={<PageLoader />}>
                <PlayerPreviewPage />
              </Suspense>
            }
          />
          <Route path="more" element={<Navigate to="/" replace />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
