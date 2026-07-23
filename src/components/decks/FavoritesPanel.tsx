import { useCallback, useEffect, useState } from "react";
import { Star, ExternalLink, Trash2 } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardDeckGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { usePageRefresh, useTelegram, useFavoriteDecks } from "@/hooks";

interface FavoriteEntry {
  cards: string[];
  deck_link?: string | null;
}

export function FavoritesPanel() {
  const { openLink } = useTelegram();
  const { removeFavorite } = useFavoriteDecks();
  const [entries, setEntries] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getFavorites();
      setEntries(res.entries ?? res.decks.map((deck) => ({ cards: deck })));
    } catch (e) {
      setEntries([]);
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (index: number) => {
    const entry = entries[index];
    if (!entry) return;
    setRemoving(index);
    try {
      await removeFavorite(entry.cards);
      setEntries((prev) => prev.filter((_, i) => i !== index));
    } catch {
      setError("Не удалось удалить колоду");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      {error && <Card className="text-center text-cr-loss text-sm">{error}</Card>}

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-cr-gold shrink-0" />
                  <p className="text-sm font-medium text-cr-text">Колода #{i + 1}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {entry.deck_link && (
                    <Button
                      variant="ghost"
                      className="!p-2"
                      onClick={() => openLink(entry.deck_link!)}
                      aria-label="Открыть в игре"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="!p-2 text-cr-loss hover:bg-cr-loss/10"
                    disabled={removing === i}
                    onClick={() => void remove(i)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDeckGrid cards={entry.cards} size="sm" showLabels maxVisible={8} />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <Star className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
          <p className="text-cr-muted">Нет избранных колод</p>
          <p className="text-xs text-cr-muted mt-1">Добавляйте колоды из других вкладок раздела «Колоды»</p>
        </Card>
      )}
    </div>
  );
}
