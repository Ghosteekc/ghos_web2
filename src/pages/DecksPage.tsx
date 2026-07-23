import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ExternalLink,
  Shuffle,
  RefreshCw,
  Trophy,
  Users,
  Swords,
  BarChart3,
  ScanSearch,
} from "lucide-react";
import { Card, Button, Loader, ElixirIcon, FeatureNavGrid, ScrollToTopButton } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { ConstructorPanel, ConstructorDeckGrid } from "@/components/decks/ConstructorPanel";
import { FavoriteDeckButton } from "@/components/decks/FavoriteDeckButton";
import { FavoritesPanel } from "@/components/decks/FavoritesPanel";
import { DeckWinratesPanel } from "@/components/analytics/AnalyticsExtras";
import { DeckPassport } from "@/analytics/deckPassport";
import { api, ApiError } from "@/api/client";
import { cacheHas, cacheGet } from "@/api/cache";
import type { ArenaDecksData, TopPlayersData } from "@/types";
import type { Deck, DeckCard, RandomDeck, TopPlayer } from "@/types";
import { usePageRefresh, useTelegram } from "@/hooks";

import { DECK_CATEGORY_LABELS, DECK_FILTER_LABELS, UI } from "@/constants/labels";

const DECK_HOME = "stats";

const DECK_NAV = [
  { id: "top", label: DECK_FILTER_LABELS.top, emoji: "👑" },
  { id: "meta", label: DECK_FILTER_LABELS.meta, emoji: "🔥" },
  { id: "arena", label: DECK_FILTER_LABELS.arena, emoji: "🏟️" },
  { id: "favorites", label: DECK_FILTER_LABELS.favorites, emoji: "⭐" },
  { id: "constructor", label: DECK_FILTER_LABELS["constructor"], emoji: "🛠️" },
  { id: "random", label: DECK_FILTER_LABELS.random, emoji: "🎲" },
] as const;

const VALID_FILTERS = new Set<string>([DECK_HOME, "mine", ...DECK_NAV.map((item) => item.id)]);

function filterFromTab(tab: string | null): string {
  if (!tab) return DECK_HOME;
  return VALID_FILTERS.has(tab) ? tab : DECK_HOME;
}

const CATEGORY_LABELS = DECK_CATEGORY_LABELS;

function formatArenaSubtitle(arenaName: string, trophies: number): string {
  if (!arenaName && trophies > 0) {
    return `${trophies.toLocaleString("ru-RU")} 🏆`;
  }
  const compact = arenaName.replace(/\s/g, "");
  const trophyStr = String(trophies);
  if (
    trophies > 0 &&
    (arenaName.includes("🏆") || compact.includes(trophyStr))
  ) {
    return arenaName;
  }
  if (trophies > 0) {
    return `${arenaName} · ${trophies.toLocaleString("ru-RU")} 🏆`;
  }
  return arenaName;
}

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

function DeckCardsGrid({ cards, useVariants = false }: { cards: DeckCard[]; useVariants?: boolean }) {
  if (useVariants) {
    return <ConstructorDeckGrid cards={cards} />;
  }
  const sorted = [...cards].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-1 mb-4">
      {sorted.map((card, i) => (
        <div key={`${card.id}-${i}`} className="min-w-0 overflow-hidden">
          <CardTile name={card.name} icon={card.icon} size="deck" />
        </div>
      ))}
    </div>
  );
}

export function DecksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [metaUpdatedAt, setMetaUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(() => filterFromTab(searchParams.get("tab")));
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [passportDeck, setPassportDeck] = useState<Deck | null>(null);

  const load = useCallback(async () => {
    if (
      filter === DECK_HOME ||
      filter === "random" ||
      filter === "top" ||
      filter === "arena" ||
      filter === "constructor" ||
      filter === "favorites"
    ) {
      setLoading(false);
      setDecks([]);
      setError(null);
      setMetaUpdatedAt(null);
      return;
    }
    const cacheKey = `decks:${filter}`;
    if (!cacheHas(cacheKey)) {
      setLoading(true);
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
    setFilter(filterFromTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void api.getTopPlayers().catch(() => {});
    void api.getArenaDecks().catch(() => {});
  }, []);

  const navActiveId = filter === DECK_HOME || filter === "mine" ? null : filter;

  const handleNavSelect = (id: string) => {
    const next = filter === id ? DECK_HOME : id;
    setFilter(next);
    if (next === DECK_HOME) {
      navigate("/decks", { replace: true });
      return;
    }
    navigate(`/decks?tab=${next}`, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Колоды</h1>
        <span className="text-sm text-cr-muted">
          {filter === DECK_HOME
            ? "Мои колоды"
            : filter === "random"
            ? "Генератор"
            : filter === "constructor"
              ? "Конструктор"
              : filter === "top"
              ? "Рейтинг"
              : filter === "arena"
                ? "Арена"
                : filter === "favorites"
                  ? "Избранное"
                : `${decks.length} колод`}
        </span>
      </div>

      <p className="text-xs text-cr-muted -mt-2">
        {filter === DECK_HOME ? (
          "Винрейт, победы и поражения по каждой колоде из ваших боёв."
        ) : filter === "meta" ? (
          <>Классические мета-колоды — проверенные архетипы Clash Royale.</>
        ) : filter === "top" ? (
          "Топ-10 игроков из глобального списка лидеров (Легендарный путь): колода, винрейт на ней и кубки."
        ) : filter === "arena" ? (
          "Популярные колоды на вашем диапазоне кубков: лучший винрейт игроков арены + мета. «Сравнить» — разбор относительно вашей колоды."
        ) : filter === "constructor" ? (
          "Выберите 4 карты — бот соберёт полные колоды с лучшей синергией. Ячейки 1 и 3 — эволюция, 2 — герой, 4 — обычная карта."
        ) : filter === "mine" ? (
          "Ваши колоды из истории боёв. Нажмите «Статистика» для разбора матчапов и советов."
        ) : filter === "favorites" ? (
          "Сохранённые колоды — быстрый доступ к избранным сборкам."
        ) : (
          "Случайная колода из 8 карт."
        )}
      </p>

      <FeatureNavGrid items={[...DECK_NAV]} activeId={navActiveId} onSelect={handleNavSelect} />

      {copyHint && (
        <Card className="text-center text-cr-win text-sm">{copyHint}</Card>
      )}

      {error && (
        <Card className="text-center text-cr-loss text-sm">{error}</Card>
      )}

      {loading &&
      filter !== DECK_HOME &&
      filter !== "random" &&
      filter !== "top" &&
      filter !== "arena" &&
      filter !== "constructor" &&
      filter !== "favorites" ? (
        <Loader />
      ) : null}

      <div className={filter === DECK_HOME ? "" : "hidden"}>
        <DeckWinratesPanel />
      </div>

      <div className={filter === "favorites" ? "" : "hidden"}>
        <FavoritesPanel />
      </div>

      <div className={filter === "random" ? "" : "hidden"}>
        <RandomDeckPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
          onAnalyze={setPassportDeck}
        />
      </div>

      <div className={filter === "top" ? "" : "hidden"}>
        <TopPlayersPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
        />
      </div>

      <div className={filter === "constructor" ? "" : "hidden"}>
        <ConstructorPanel
          renderDeckCard={(deck, i) => (
            <div key={`${deck.id}-${deck.name}`} className="w-full">
              <DeckCard
                deck={deck}
                index={i}
                onCopied={(msg) => {
                  setCopyHint(msg);
                  setTimeout(() => setCopyHint(null), 3000);
                }}
                onAnalyze={() => setPassportDeck(deck)}
              />
            </div>
          )}
        />
      </div>

      <div className={filter === "arena" ? "" : "hidden"}>
        <ArenaPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
          onAnalyze={setPassportDeck}
        />
      </div>

      {(filter === "meta" || filter === "mine") && (
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
                onOpenStats={
                  deck.type === "mine"
                    ? () => {
                        const key = [...(deck.cards ?? []).map((c) => c.name)].sort().join("|");
                        navigate(`/decks/mine/stats?deck=${encodeURIComponent(key)}`);
                      }
                    : undefined
                }
                onAnalyze={() => setPassportDeck(deck)}
              />
            </div>
          ))}
          {!error && decks.length === 0 && !loading ? (
            <Card className="col-span-full text-center">
              <SlidersHorizontal className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
              <p className="text-cr-muted">Колоды не найдены</p>
              <p className="text-xs text-cr-muted mt-1">
                Выберите «Мета» или сыграйте бои для раздела «Мои»
              </p>
            </Card>
          ) : null}
        </div>
      )}

      <DeckPassport deck={passportDeck} onClose={() => setPassportDeck(null)} />

      <ScrollToTopButton />
    </div>
  );
}

export { DecksPage as default };

function buildComparePath(deck: Deck, fromTab = "arena"): string {
  const names = deck.cards.map((c) => c.name);
  if (names.length !== 8) return "";
  const ref = names.map(encodeURIComponent).join("|");
  const name = encodeURIComponent(deck.name ?? "Колода");
  return `/decks/compare?ref=${ref}&name=${name}&from=${fromTab}`;
}

function ArenaPanel({
  onCopied,
  onAnalyze,
}: {
  onCopied: (msg: string) => void;
  onAnalyze: (deck: Deck) => void;
}) {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>(() => {
    const hit = cacheGet<ArenaDecksData>("arena-decks-v4");
    return hit?.decks ?? [];
  });
  const [arenaName, setArenaName] = useState(() => cacheGet<ArenaDecksData>("arena-decks-v4")?.arena_name ?? "");
  const [trophies, setTrophies] = useState(() => cacheGet<ArenaDecksData>("arena-decks-v4")?.trophies ?? 0);
  const [loading, setLoading] = useState(() => !cacheHas("arena-decks-v4"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hasCache = cacheHas("arena-decks-v4");
    if (!hasCache) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await api.getArenaDecks();
      setDecks(data.decks ?? []);
      setArenaName(data.arena_name ?? "");
      setTrophies(data.trophies ?? 0);
    } catch (e) {
      if (!hasCache) {
        setDecks([]);
      }
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить колоды арены");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader />;

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
        {formatArenaSubtitle(arenaName, trophies)}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full overflow-x-hidden">
        {decks.map((deck, i) => (
          <div key={`${deck.id}-${deck.name}`} className="w-full">
            <DeckCard
              deck={deck}
              index={i}
              onCopied={onCopied}
              showCompare
              onCompare={() => {
                const path = buildComparePath(deck, "arena");
                if (path) navigate(path);
              }}
              onAnalyze={() => onAnalyze(deck)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopPlayersPanel({ onCopied }: { onCopied: (msg: string) => void }) {
  const { openLink } = useTelegram();
  const [players, setPlayers] = useState<TopPlayer[]>(() => {
    const hit = cacheGet<TopPlayersData>("top-players-v2");
    return hit?.players ?? [];
  });
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    () => cacheGet<TopPlayersData>("top-players-v2")?.updated_at ?? null,
  );
  const [loading, setLoading] = useState(() => !cacheHas("top-players-v2"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cacheHas("top-players-v2")) {
      setLoading(true);
    }
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

  if (loading) return <Loader />;

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
                <p className={"text-xs font-bold mt-0.5 " + (player.total_games > 0 ? (player.winrate >= 50 ? "text-cr-win" : "text-cr-loss") : "text-cr-muted")}>
                  {player.total_games > 0
                    ? `${UI.winrateShort} ${player.winrate.toFixed(0)}%`
                    : "Винрейт: нет данных"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs mb-3">
              <ElixirIcon size={14} />
              <span className="font-semibold text-cr-text">{player.avg_elixir.toFixed(1)}</span>
              {player.total_games > 0 ? (
                <span className="text-cr-muted ml-2">{player.total_games} {UI.battles}</span>
              ) : null}
            </div>

            <DeckCardsGrid cards={player.cards} />

            <div className="flex gap-2 mt-0">
              {player.deck_link ? (
                <Button
                  variant="secondary"
                  className="flex-1 !py-2 text-sm flex items-center justify-center gap-2"
                  onClick={() => void importDeck(player.deck_link)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Импорт колоды
                </Button>
              ) : (
                <p className="flex-1 text-xs text-cr-muted text-center self-center">
                  Импорт недоступен
                </p>
              )}
              {player.cards.length === 8 ? (
                <FavoriteDeckButton
                  cards={player.cards.map((c) => c.name)}
                  onMessage={onCopied}
                />
              ) : null}
            </div>
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
            className="w-6 h-6 shrink-0 rounded-full border border-cr-border bg-cr-card/60 text-xs font-bold text-cr-muted transition-colors"
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

function RandomDeckPanel({
  onCopied,
  onAnalyze,
}: {
  onCopied: (msg: string) => void;
  onAnalyze: (deck: Deck) => void;
}) {
  const { openLink } = useTelegram();
  const [deck, setDeck] = useState<RandomDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rofl, setRofl] = useState(false);
  const lastRoflKeyRef = useRef<string | null>(null);

  useEffect(() => {
    lastRoflKeyRef.current = null;
  }, [rofl]);

  const roll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRandomDeck(
        rofl,
        rofl ? lastRoflKeyRef.current ?? undefined : undefined,
      );
      if (data.rofl_key) {
        lastRoflKeyRef.current = data.rofl_key;
      } else {
        lastRoflKeyRef.current = null;
      }
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

  if (loading && !deck) {
    return (
      <div className="space-y-3">
        <RoflModeBar rofl={rofl} onRoflChange={setRofl} />
        <Loader />
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

        <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-1 mb-4">
          {deck.card_infos.map((card, i) => (
            <div key={card.id} className="min-w-0 overflow-hidden">
              <CardTile name={card.name} icon={card.icon} size="deck" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {deck.cards.length === 8 ? (
            <Button
              variant="secondary"
              className="w-full !py-2 text-sm flex items-center justify-center gap-2"
              onClick={() =>
                onAnalyze({
                  id: 0,
                  name: deck.rofl_name ?? "Случайная колода",
                  cards: deck.card_infos.map((c, slot) => ({
                    ...c,
                    slot,
                    rarity: undefined,
                    evolution_level: 0,
                    is_hero: false,
                  })),
                  winrate: 0,
                  total_games: 0,
                  avg_elixir: deck.avg_elixir,
                  best_matchups: [],
                  worst_matchups: [],
                  type: "random",
                  deck_link: deck.deck_link,
                })
              }
            >
              <ScanSearch className="w-4 h-4" />
              Анализ
            </Button>
          ) : null}
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
              <Button
                variant="secondary"
                className="flex-1 !py-2 text-sm flex items-center justify-center gap-2"
                onClick={() => void importDeck()}
              >
                <ExternalLink className="w-4 h-4" />
                В игру
              </Button>
            ) : null}
            {deck.cards.length === 8 ? (
              <FavoriteDeckButton cards={deck.cards} onMessage={onCopied} />
            ) : null}
          </div>
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
  onCompare,
  onOpenStats,
  onAnalyze,
}: {
  deck: Deck;
  index: number;
  onCopied: (msg: string) => void;
  showCompare?: boolean;
  onCompare?: () => void;
  onOpenStats?: () => void;
  onAnalyze?: () => void;
}) {
  const { openLink } = useTelegram();
  const cards = deck.cards ?? [];
  const avgElixir = deck.avg_elixir ?? 0;
  const winrate = deck.winrate ?? 0;
  const category = deck.category ?? deck.type;
  const canImport = Boolean(deck.deck_link);
  const canFavorite = cards.length === 8;

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

  const cardNames = cards.map((c) => c.name);

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

        <DeckCardsGrid cards={cards} useVariants={deck.type === "constructor"} />

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

        {deck.type === "constructor" && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-cr-muted">Синергия</span>
              <span className="font-bold text-cr-gold">
                {(deck.synergy_score ?? deck.winrate).toFixed(0)}%
              </span>
            </div>
            {deck.synergy_notes && deck.synergy_notes.length > 0 ? (
              <ul className="text-[11px] text-cr-muted space-y-0.5 mb-3">
                {deck.synergy_notes.slice(0, 2).map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            ) : null}
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

        {deck.type === "mine" && onOpenStats ? (
          <Button
            variant="secondary"
            className="w-full !py-2 text-sm flex items-center justify-center gap-2 mb-3"
            onClick={onOpenStats}
          >
            <BarChart3 className="w-4 h-4" />
            Статистика колоды
          </Button>
        ) : null}

        {showCompare && onCompare ? (
          <Button
            variant="secondary"
            className="w-full !py-2 text-sm flex items-center justify-center gap-2 mb-3"
            onClick={onCompare}
          >
            <Swords className="w-4 h-4" />
            Сравнить с моей
          </Button>
        ) : null}

        {canFavorite && onAnalyze ? (
          <Button
            variant="secondary"
            className="w-full !py-2 text-sm flex items-center justify-center gap-2 mb-3"
            onClick={onAnalyze}
          >
            <ScanSearch className="w-4 h-4" />
            Анализ
          </Button>
        ) : null}

        {canImport || canFavorite ? (
          <div className="flex gap-2">
            {canImport ? (
              <Button
                variant="secondary"
                className="flex-1 !py-2 text-sm flex items-center justify-center gap-2"
                onClick={() => void importDeck()}
              >
                <ExternalLink className="w-4 h-4" />
                Импорт в игру
              </Button>
            ) : (
              <p className="flex-1 text-xs text-cr-muted text-center self-center leading-snug px-1">
                Импорт недоступен — не все карты распознаны
              </p>
            )}
            {canFavorite ? (
              <FavoriteDeckButton cards={cardNames} onMessage={onCopied} />
            ) : null}
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
