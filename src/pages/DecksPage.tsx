import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  TrendingUp,
  ExternalLink,
  Star,
} from "lucide-react";
import { Card, Button, SkeletonGroup } from "@/components/ui";
import { api, ApiError } from "@/api/client";
import { Deck } from "@/types";
import { usePageRefresh, useTelegram } from "@/hooks";

const DECK_FILTERS = [
  { id: "all", label: "Все" },
  { id: "meta", label: "Мета" },
  { id: "mine", label: "Мои" },
  { id: "cycle", label: "Цикл" },
  { id: "beatdown", label: "Битдаун" },
  { id: "control", label: "Контроль" },
  { id: "bait", label: "Bait" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  meta: "Мета",
  mine: "Мои",
  cycle: "Цикл",
  beatdown: "Битдаун",
  control: "Контроль",
  bait: "Bait",
};

export function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getDecks(filter === "all" ? undefined : filter);
      setDecks(res.decks ?? []);
    } catch (e) {
      setDecks([]);
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки колод");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Колоды</h1>
        <span className="text-sm text-cr-muted">{decks.length} колод</span>
      </div>

      <p className="text-xs text-cr-muted -mt-2">
        Мета-колоды — популярные архетипы. «Мои» — из вашей истории боёв.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {DECK_FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 " +
              (filter === item.id
                ? "bg-cr-gold text-cr-bg shadow-glow"
                : "bg-cr-card text-cr-muted hover:text-cr-text border border-cr-border")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {copyHint && (
        <Card className="text-center text-cr-win text-sm">{copyHint}</Card>
      )}

      {error && (
        <Card className="text-center text-cr-loss text-sm">{error}</Card>
      )}

      {loading ? (
        <SkeletonGroup count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full overflow-x-hidden">
          {decks.map((deck, i) => (
            <div key={`${deck.id}-${deck.name}`} className="w-full">
              <DeckCard
                deck={deck}
                index={i}
                onCopied={(msg) => {
                  setCopyHint(msg);
                  setTimeout(() => setCopyHint(null), 3000);
                }}
              />
            </div>
          ))}
          {!error && decks.length === 0 && (
            <Card className="col-span-full text-center">
              <SlidersHorizontal className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
              <p className="text-cr-muted">Колоды не найдены</p>
              <p className="text-xs text-cr-muted mt-1">
                Выберите «Мета» или сыграйте бои для раздела «Мои»
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export { DecksPage as default };

function DeckCard({
  deck,
  index,
  onCopied,
}: {
  deck: Deck;
  index: number;
  onCopied: (msg: string) => void;
}) {
  const { openLink } = useTelegram();
  const cards = deck.cards ?? [];
  const avgElixir = deck.avg_elixir ?? 0;
  const winrate = deck.winrate ?? 0;
  const category = deck.category ?? deck.type;
  const canImport = Boolean(deck.deck_link);

  const importDeck = async () => {
    if (!deck.deck_link) return;
    if (openLink) {
      openLink(deck.deck_link);
      onCopied("Открываем Clash Royale для импорта колоды…");
      return;
    }
    try {
      await navigator.clipboard.writeText(deck.deck_link);
      onCopied("Ссылка на колоду скопирована");
    } catch {
      onCopied("Откройте приложение из Telegram для импорта колоды");
    }
  };

  const saveFavorite = async () => {
    const names = cards.map((c) => c.name);
    if (names.length !== 8) return;
    try {
      await api.addFavoriteDeck(names);
      onCopied("Колода добавлена в избранное");
    } catch {
      onCopied("Не удалось сохранить колоду");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-cr-blue bg-cr-blue/10 px-2.5 py-1 rounded-full border border-cr-blue/20">
            {CATEGORY_LABELS[category] ?? category}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-cr-gold" />
            <span className="font-semibold text-cr-text">{avgElixir.toFixed(1)}</span>
          </div>
        </div>

        {deck.name && (
          <h3 className="text-sm font-semibold text-cr-text mb-1">{deck.name}</h3>
        )}
        {deck.description && (
          <p className="text-xs text-cr-muted mb-3">{deck.description}</p>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          {cards.map((card) => (
            <div
              key={card.id}
              title={card.name}
              className="aspect-square rounded-xl bg-cr-bg/60 border border-cr-border flex items-center justify-center text-2xl hover:scale-105 transition-transform"
            >
              {card.icon ? (
                <img src={card.icon} alt={card.name} className="w-8 h-8 object-contain" loading="lazy" />
              ) : (
                "🃏"
              )}
            </div>
          ))}
        </div>

        {deck.type === "mine" && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-cr-muted">Winrate</span>
              <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
                {winrate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1 mb-3">
              <span className="text-cr-muted">Игр</span>
              <span className="font-semibold text-cr-text">{deck.total_games ?? 0}</span>
            </div>
          </>
        )}

        {canImport ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 !py-2 text-sm" onClick={() => void importDeck()}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Импорт в игру
            </Button>
            <Button variant="ghost" className="!px-3" onClick={() => void saveFavorite()} aria-label="В избранное">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-cr-muted text-center">
            Импорт недоступен — не все карты распознаны API
          </p>
        )}
      </Card>
    </motion.div>
  );
}
