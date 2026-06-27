import { useState, useEffect } from "react";
import { Star, Copy, Trash2 } from "lucide-react";
import { Card, Button, Loader, SkeletonGroup } from "@/components/ui";
import { api } from "@/api/client";

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<{ cards: any[]; decks: string[][] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getFavorites();
        setFavorites(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-cr-text tracking-tight">Любимые колоды</h1>

      {favorites && favorites.decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.decks.map((deck, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cr-gold/10">
                    <Star className="w-5 h-5 text-cr-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cr-text">Колода #{i + 1}</p>
                    <p className="text-xs text-cr-muted">{deck.length} карт</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="!p-2">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" className="!p-2">
                    <Trash2 className="w-4 h-4 text-cr-loss" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <Star className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
          <p className="text-cr-muted">Нет избранных колод</p>
          <p className="text-xs text-cr-muted mt-1">Добавляйте колоды из анализатора</p>
        </Card>
      )}
    </div>
  );
}

export { FavoritesPage as default };