import { useCallback, useEffect, useState } from "react";
import { Star, ExternalLink, Trash2, ScanSearch, Swords } from "lucide-react";
import { Card, Button, Loader, ErrorState, EmptyState } from "@/components/ui";
import { CardDeckGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { usePageRefresh, useTelegram, useFavoriteDecks } from "@/hooks";
import type { Deck } from "@/types";
import { deckFromCardNames } from "@/utils/deckActions";

interface FavoriteEntry {
  cards: string[];
  deck_link?: string | null;
}

type FavoritesPanelProps = {
  onAnalyze?: (deck: Deck) => void;
  onCompare?: (deck: Deck) => void;
};

export function FavoritesPanel({ onAnalyze, onCompare }: FavoritesPanelProps) {
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

  const toDeck = (entry: FavoriteEntry, index: number): Deck | null =>
    deckFromCardNames(entry.cards, {
      id: index + 1,
      name: `Избранное #${index + 1}`,
      type: "meta",
      deckLink: entry.deck_link,
    });

  if (loading) return <Loader variant="section" />;

  return (
    <div className="space-y-4">
      {error && <ErrorState title={error} />}

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry, i) => {
            const canAct = entry.cards.length === 8;
            return (
              <Card key={i} noMotion>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-cr-gold shrink-0" />
                    <p className="text-base font-medium text-cr-text">Колода #{i + 1}</p>
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
                      className="!p-2 text-cr-loss"
                      disabled={removing === i}
                      onClick={() => void remove(i)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDeckGrid cards={entry.cards} size="lg" showLabels maxVisible={8} />
                {canAct && (onAnalyze || onCompare) ? (
                  <div
                    className={
                      "grid gap-2 mt-3 " +
                      (onAnalyze && onCompare ? "grid-cols-2" : "grid-cols-1")
                    }
                  >
                    {onAnalyze ? (
                      <Button
                        variant="secondary"
                        className="!py-2 text-base flex items-center justify-center gap-2"
                        onClick={() => {
                          const deck = toDeck(entry, i);
                          if (deck) onAnalyze(deck);
                        }}
                      >
                        <ScanSearch className="w-4 h-4" />
                        Анализ
                      </Button>
                    ) : null}
                    {onCompare ? (
                      <Button
                        variant="secondary"
                        className="!py-2 text-base flex items-center justify-center gap-2"
                        onClick={() => {
                          const deck = toDeck(entry, i);
                          if (deck) onCompare(deck);
                        }}
                      >
                        <Swords className="w-4 h-4" />
                        Сравнить
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Star className="h-12 w-12 opacity-50" />}
          title="Нет избранных колод"
          description="Добавляйте колоды из других вкладок раздела «Колоды»"
        />
      )}
    </div>
  );
}
