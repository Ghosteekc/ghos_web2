import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { Loader } from "@/components/ui";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";

const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const DecksPage = lazy(() =>
  import("@/pages/DecksPage").then((m) => ({ default: m.DecksPage })),
);
const BattlesPage = lazy(() =>
  import("@/pages/BattlesPage").then((m) => ({ default: m.BattlesPage })),
);
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
  );
}
