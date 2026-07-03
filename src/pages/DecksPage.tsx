import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ExternalLink,
  Star,
  Shuffle,
  RefreshCw,
  Trophy,
  Users,
  Swords,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, Button, SkeletonGroup, ElixirIcon } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import type { Deck, DeckCard, DeckCompareResult, RandomDeck, TopPlayer } from "@/types";
import { usePageRefresh, useTelegram } from "@/hooks";

import { DECK_CATEGORY_LABELS, DECK_FILTER_LABELS, UI } from "@/constants/labels";

const DECK_FILTERS = [
  { id: "meta", label: DECK_FILTER_LABELS.meta },
  { id: "top", label: DECK_FILTER_LABELS.top },
  { id: "mine", label: DECK_FILTER_LABELS.mine },
  { id: "arena", label: DECK_FILTER_LABELS.arena },
  { id: "random", label: DECK_FILTER_LABELS.random },
] as const;

const CATEGORY_LABELS = DECK_CATEGORY_LABELS;

function formatUpdatedAt(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function DeckCardsGrid({ cards }: { cards: DeckCard[] }) {
  const sorted = [...cards].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-4">
      {sorted.map((card, i) => (
        <div key={`${card.id}-${i}`} className="min-w-0 overflow-hidden">
          <CardTile name={card.name} icon={card.icon} size="deck" />
        </div>
      ))}
    </div>
  );
}

export function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [metaUpdatedAt, setMetaUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("meta");
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (filter === "random" || filter === "top" || filter === "arena") {
      setLoading(false);
      setDecks([]);
      setError(null);
      setMetaUpdatedAt(null);
      return;
    }
    try {
      setError(null);
      const res = await api.getDecks(filter);
      setDecks(res.decks ?? []);
      setMetaUpdatedAt(res.meta_updated_at ?? null);
    } catch (e) {
      setDecks([]);
      setMetaUpdatedAt(null);
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
        <span className="text-sm text-cr-muted">
          {filter === "random"
            ? "Генератор"
            : filter === "top"
              ? "Рейтинг"
              : filter === "arena"
                ? "Арена"
                : `${decks.length} колод`}
        </span>
      </div>

      <p className="text-xs text-cr-muted -mt-2">
        {filter === "meta" ? (
          <>Классические мета-колоды — проверенные архетипы Clash Royale.</>
        ) : filter === "top" ? (
          "Топ игроков мира по кубкам — их текущие колоды и винрейт за последние бои."
        ) : filter === "arena" ? (
          "Популярные колоды на вашем диапазоне кубков: лучший винрейт игроков арены + мета. «Сравнить» — разбор относительно вашей колоды."
        ) : filter === "mine" ? (
          "Ваши колоды из истории боёв."
        ) : (
          "Случайная колода из 8 карт."
        )}
      </p>

      <div className="filter-tab-row">
        {DECK_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={"filter-tab " + (filter === item.id ? "filter-tab--active" : "")}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-cr-muted flex items-center gap-1 -mt-3 pb-1">
        <ChevronLeft className="w-3 h-3 shrink-0 opacity-70" />
        Листайте вкладки влево и вправо
        <ChevronRight className="w-3 h-3 shrink-0 opacity-70" />
      </p>

      {copyHint && (
        <Card className="text-center text-cr-win text-sm">{copyHint}</Card>
      )}

      {error && (
        <Card className="text-center text-cr-loss text-sm">{error}</Card>
      )}

      {loading && filter !== "random" && filter !== "top" && filter !== "arena" ? (
        <SkeletonGroup count={4} />
      ) : filter === "random" ? (
        <RandomDeckPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
        />
      ) : filter === "top" ? (
        <TopPlayersPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
        />
      ) : filter === "arena" ? (
        <ArenaPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
        />
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

function CompareBlock({ title, items, tone }: { title: string; items: string[]; tone: "win" | "loss" | "muted" }) {
  if (!items.length) return null;
  const color =
    tone === "win" ? "text-cr-win" : tone === "loss" ? "text-cr-loss" : "text-cr-muted";
  return (
    <div className="mt-2">
      <p className={"text-xs font-semibold mb-1 " + color}>{title}</p>
      <ul className="space-y-1">
        {items.map((line) => (
          <li key={line} className="text-xs text-cr-text leading-snug">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeckComparePanel({ data }: { data: DeckCompareResult }) {
  return (
    <div className="mt-4 pt-4 border-t border-cr-border space-y-3">
      <p className="text-xs font-cr text-cr-gold">Сравнение с «{data.reference_name}»</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="!p-3 bg-cr-bg/40">
          <p className="text-xs font-semibold text-cr-text mb-2">Ваша колода</p>
          <CompareBlock title="Сильнее" items={data.user_better} tone="win" />
          <CompareBlock title="Слабее" items={data.user_worse} tone="loss" />
        </Card>
        <Card className="!p-3 bg-cr-bg/40">
          <p className="text-xs font-semibold text-cr-text mb-2">Популярная колода</p>
          <CompareBlock title="Сильнее вашей" items={data.reference_better} tone="win" />
          <CompareBlock title="Слабее вашей" items={data.reference_worse} tone="loss" />
        </Card>
      </div>
    </div>
  );
}

function ArenaPanel({ onCopied }: { onCopied: (msg: string) => void }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [arenaName, setArenaName] = useState("");
  const [trophies, setTrophies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [compareData, setCompareData] = useState<DeckCompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandedId(null);
    setCompareData(null);
    try {
      const data = await api.getArenaDecks();
      setDecks(data.decks ?? []);
      setArenaName(data.arena_name ?? "");
      setTrophies(data.trophies ?? 0);
    } catch (e) {
      setDecks([]);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить колоды арены");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runCompare = async (deck: Deck) => {
    const names = deck.cards.map((c) => c.name);
    if (names.length !== 8) return;
    if (expandedId === deck.id && compareData) {
      setExpandedId(null);
      setCompareData(null);
      return;
    }
    setExpandedId(deck.id);
    setCompareLoading(true);
    setCompareError(null);
    setCompareData(null);
    try {
      const result = await api.compareDeck(names);
      setCompareData(result);
    } catch (e) {
      setCompareError(e instanceof ApiError ? e.message : "Не удалось сравнить колоды");
    } finally {
      setCompareLoading(false);
    }
  };

  if (loading) return <SkeletonGroup count={3} />;

  if (error) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-cr-loss text-sm">{error}</p>
        <Button onClick={() => void load()}>Попробовать снова</Button>
      </Card>
    );
  }

  if (!decks.length) {
    return (
      <Card className="text-center">
        <p className="text-cr-muted">Нет данных по вашей арене</p>
        <p className="text-xs text-cr-muted mt-1">Сыграйте несколько боёв и обновите страницу</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-cr-muted text-center">
        {arenaName}
        {trophies > 0 ? ` · ${trophies} 🏆` : ""}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full overflow-x-hidden">
        {decks.map((deck, i) => (
          <div key={`${deck.id}-${deck.name}`} className="w-full">
            <DeckCard
              deck={deck}
              index={i}
              onCopied={onCopied}
              showCompare
              compareOpen={expandedId === deck.id}
              compareLoading={expandedId === deck.id && compareLoading}
              compareError={expandedId === deck.id ? compareError : null}
              compareData={expandedId === deck.id ? compareData : null}
              onCompare={() => void runCompare(deck)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopPlayersPanel({ onCopied }: { onCopied: (msg: string) => void }) {
  const { openLink } = useTelegram();
  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTopPlayers();
      setPlayers(data.players ?? []);
      setUpdatedAt(data.updated_at ?? null);
    } catch (e) {
      setPlayers([]);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить топ игроков");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const importDeck = async (deckLink?: string | null) => {
    if (!deckLink) return;
    if (openLink) {
      openLink(deckLink);
      onCopied("Открываем Clash Royale для импорта колоды…");
      return;
    }
    try {
      await navigator.clipboard.writeText(deckLink);
      onCopied("Ссылка на колоду скопирована");
    } catch {
      onCopied("Откройте приложение из Telegram для импорта колоды");
    }
  };

  if (loading) return <SkeletonGroup count={3} />;

  if (error) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-cr-loss text-sm">{error}</p>
        <Button onClick={() => void load()}>Попробовать снова</Button>
      </Card>
    );
  }

  if (!players.length) {
    return (
      <Card className="text-center">
        <Users className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
        <p className="text-cr-muted">Рейтинг временно недоступен</p>
        <p className="text-xs text-cr-muted mt-1">Попробуйте позже</p>
      </Card>
    );
  }

  const updatedLabel = formatUpdatedAt(updatedAt);

  return (
    <div className="space-y-4">
      {updatedLabel && (
        <p className="text-xs text-cr-muted text-center">Обновлено: {updatedLabel}</p>
      )}
      {players.map((player, i) => (
        <motion.div
          key={player.player_tag}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Card>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-cr-gold bg-cr-gold/10 px-2 py-0.5 rounded-full border border-cr-gold/20">
                    #{player.rank}
                  </span>
                  <h3 className="text-sm font-semibold text-cr-text truncate">{player.player_name}</h3>
                </div>
                <p className="text-xs text-cr-muted truncate">
                  #{player.player_tag}
                  {player.clan_name ? ` · ${player.clan_name}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-xs text-cr-muted">
                  <Trophy className="w-3.5 h-3.5 text-cr-gold" />
                  <span className="font-semibold text-cr-text">{player.trophies}</span>
                </div>
                <p className={"text-xs font-bold mt-0.5 " + (player.winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
                  {UI.winrateShort} {player.winrate.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs mb-3">
              <ElixirIcon size={14} />
              <span className="font-semibold text-cr-text">{player.avg_elixir.toFixed(1)}</span>
              <span className="text-cr-muted ml-2">{player.total_games} {UI.battles}</span>
            </div>

            <DeckCardsGrid cards={player.cards} />

            {player.deck_link ? (
              <Button
                variant="secondary"
                className="w-full !py-2 text-sm flex items-center justify-center gap-2"
                onClick={() => void importDeck(player.deck_link)}
              >
                <ExternalLink className="w-4 h-4" />
                Импорт колоды
              </Button>
            ) : null}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function RoflModeBar({
  rofl,
  onRoflChange,
}: {
  rofl: boolean;
  onRoflChange: (value: boolean) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-cr-text">Рофл-режим</span>
          <button
            type="button"
            aria-label="Что такое рофл-режим"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((v) => !v)}
            className="w-6 h-6 shrink-0 rounded-full border border-cr-border bg-cr-card/60 text-xs font-bold text-cr-muted hover:text-cr-text hover:border-cr-gold/40 transition-colors"
          >
            ?
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rofl}
          aria-label="Рофл-режим"
          onClick={() => onRoflChange(!rofl)}
          className={
            "relative w-11 h-6 rounded-full transition-colors shrink-0 " +
            (rofl ? "bg-cr-gold" : "bg-cr-border")
          }
        >
          <span
            className={
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform " +
              (rofl ? "translate-x-5" : "")
            }
          />
        </button>
      </div>
      {showHelp ? (
        <p className="text-xs text-cr-muted leading-snug px-0.5">
          Часто сливаешь из-за слабости своей колоды?
          <br />
          Включи тумблер и импортируй предложенную колоду в игру!
          <br />
          С ней, ты будешь сливать куда чаще, зато веселее!
        </p>
      ) : null}
    </div>
  );
}

function RandomDeckPanel({ onCopied }: { onCopied: (msg: string) => void }) {
  const { openLink } = useTelegram();
  const [deck, setDeck] = useState<RandomDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rofl, setRofl] = useState(false);

  const roll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRandomDeck(rofl);
      setDeck(data);
    } catch (e) {
      setDeck(null);
      setError(e instanceof ApiError ? e.message : "Не удалось сгенерировать колоду");
    } finally {
      setLoading(false);
    }
  }, [rofl]);

  useEffect(() => {
    void roll();
  }, [roll]);

  const importDeck = async () => {
    if (!deck?.deck_link) return;
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
    if (!deck || deck.cards.length !== 8) return;
    try {
      await api.addFavoriteDeck(deck.cards);
      onCopied("Колода добавлена в избранное");
    } catch {
      onCopied("Не удалось сохранить колоду");
    }
  };

  if (loading && !deck) {
    return (
      <div className="space-y-3">
        <RoflModeBar rofl={rofl} onRoflChange={setRofl} />
        <SkeletonGroup count={1} />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="space-y-3">
        <RoflModeBar rofl={rofl} onRoflChange={setRofl} />
        <Card className="text-center space-y-3">
          <p className="text-cr-loss text-sm">{error ?? "Ошибка"}</p>
          <Button onClick={() => void roll()}>Попробовать снова</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <RoflModeBar rofl={rofl} onRoflChange={setRofl} />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs font-medium text-cr-gold bg-cr-gold/10 px-2.5 py-1 rounded-full border border-cr-gold/20 flex items-center gap-1 shrink-0">
            <Shuffle className="w-3 h-3" />
            {deck.rofl ? (deck.rofl_name ?? "Рофл") : "Случайная колода"}
          </span>
          <div className="flex items-center gap-1 text-xs shrink-0">
            <ElixirIcon size={14} />
            <span className="font-semibold text-cr-text">{deck.avg_elixir.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-xs text-cr-muted mb-4">
          {deck.rofl
            ? (deck.rofl_tagline ?? "Угарная колода ради смеха. В ranked не играйте.")
            : "8 случайных карт, как в игре. Нажмите «Перегенерировать», если колода не нравится."}
        </p>

        <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-4">
          {deck.card_infos.map((card, i) => (
            <div key={card.id} className="min-w-0 overflow-hidden">
              <CardTile name={card.name} icon={card.icon} size="deck" />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 !py-2 text-sm flex items-center justify-center gap-2"
            onClick={() => void roll()}
            disabled={loading}
          >
            <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
            Перегенерировать
          </Button>
          {deck.deck_link ? (
            <>
              <Button
                variant="secondary"
                className="flex-1 !py-2 text-sm flex items-center justify-center gap-2"
                onClick={() => void importDeck()}
              >
                <ExternalLink className="w-4 h-4" />
                В игру
              </Button>
              <Button variant="ghost" className="!px-3" onClick={() => void saveFavorite()} aria-label="В избранное">
                <Star className="w-4 h-4" />
              </Button>
            </>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

function DeckCard({
  deck,
  index,
  onCopied,
  showCompare = false,
  compareOpen = false,
  compareLoading = false,
  compareError = null,
  compareData = null,
  onCompare,
}: {
  deck: Deck;
  index: number;
  onCopied: (msg: string) => void;
  showCompare?: boolean;
  compareOpen?: boolean;
  compareLoading?: boolean;
  compareError?: string | null;
  compareData?: DeckCompareResult | null;
  onCompare?: () => void;
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
            <ElixirIcon size={14} />
            <span className="font-semibold text-cr-text">{avgElixir.toFixed(1)}</span>
          </div>
        </div>

        {deck.name && (
          <h3 className="text-sm font-semibold text-cr-text mb-1">{deck.name}</h3>
        )}
        {deck.description && (
          <p className="text-xs text-cr-muted mb-3">{deck.description}</p>
        )}

        <DeckCardsGrid cards={cards} />

        {deck.type === "meta" && deck.total_games > 0 && (
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-cr-muted">{UI.winrate} топов</span>
            <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
              {winrate.toFixed(1)}%
            </span>
          </div>
        )}

        {deck.type === "mine" && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-cr-muted">{UI.winrate}</span>
              <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
                {winrate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1 mb-3">
              <span className="text-cr-muted">{UI.games}</span>
              <span className="font-semibold text-cr-text">{deck.total_games ?? 0}</span>
            </div>
          </>
        )}

        {deck.type === "arena" && deck.total_games > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-cr-muted">{UI.winrate}</span>
              <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
                {winrate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1 mb-3">
              <span className="text-cr-muted">{UI.games}</span>
              <span className="font-semibold text-cr-text">{deck.total_games ?? 0}</span>
            </div>
          </>
        )}

        {showCompare && onCompare ? (
          <div className="space-y-2 mb-3">
            <Button
              variant="secondary"
              className="w-full !py-2 text-sm flex items-center justify-center gap-2"
              onClick={onCompare}
              disabled={compareLoading}
            >
              <Swords className="w-4 h-4" />
              {compareOpen && compareData ? "Скрыть сравнение" : "Сравнить с моей"}
              {compareOpen ? (
                compareLoading ? null : <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            {compareError ? (
              <p className="text-xs text-cr-loss text-center">{compareError}</p>
            ) : null}
            {compareOpen && compareLoading ? (
              <p className="text-xs text-cr-muted text-center">Анализируем колоды…</p>
            ) : null}
            {compareOpen && compareData ? <DeckComparePanel data={compareData} /> : null}
          </div>
        ) : null}

        {canImport ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 !py-2 text-sm flex items-center justify-center gap-2" onClick={() => void importDeck()}>
              <ExternalLink className="w-4 h-4" />
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
