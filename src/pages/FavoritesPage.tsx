import { FavoritesPanel } from "@/components/decks/FavoritesPanel";

export function FavoritesPage() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Любимые колоды</h1>
      <FavoritesPanel />
    </div>
  );
}

export { FavoritesPage as default };
