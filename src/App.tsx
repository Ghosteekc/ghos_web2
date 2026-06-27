import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { Loader } from "@/components/ui";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const Analytics = lazy(() => import("@/pages/AnalyticsPage"));
const DecksPage = lazy(() => import("@/pages/DecksPage"));
const BattlesPage = lazy(() => import("@/pages/BattlesPage"));
const BattleDetailPage = lazy(() => import("@/pages/BattleDetailPage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
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
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
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
            path="battles/:index"
            element={
              <Suspense fallback={<PageLoader />}>
                <BattleDetailPage />
              </Suspense>
            }
          />
          <Route
            path="stats"
            element={
              <Suspense fallback={<PageLoader />}>
                <StatsPage />
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