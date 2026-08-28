import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Bot,
} from "lucide-react";
import { Card, Button, Loader, ElixirIcon, FeatureNavGrid, ScrollToTopButton, ErrorState, EmptyState, PageHeader } from "@/components/ui";
import { CardTile, PlayerDeckGrid } from "@/components/cards";
import { FavoriteDeckButton } from "@/components/decks/FavoriteDeckButton";
import { DeckWinratesPanel } from "@/components/analytics/AnalyticsExtras";
import { DeckPassport } from "@/analytics/deckPassport";
import { api, ApiError } from "@/api/client";
import { cacheHas, cacheGet } from "@/api/cache";
import type { Deck, DeckCard as DeckCardData, RandomDeck, TopPlayer, TopPlayersData } from "@/types";
import { usePageRefresh, useTelegram } from "@/hooks";
import { deckFromCardNames, deckToComparePath } from "@/utils/deckActions";
import { contextFromConstructor, openGhosteekAi } from "@/utils/aiPageContext";
import { DecisionExplanationView } from "@/components/recommendations/DecisionExplanationView";

import { DECK_CATEGORY_LABELS, DECK_FILTER_LABELS, UI } from "@/constants/labels";

const FavoritesPanel = lazy(() =>
  import("@/components/decks/FavoritesPanel").then((m) => ({ default: m.FavoritesPanel })),
);
const ArenaDecksPanel = lazy(() =>
  import("@/components/analytics/ArenaDecksPanel").then((m) => ({ default: m.ArenaDecksPanel })),
);
const ConstructorPanel = lazy(() =>
  import("@/components/decks/ConstructorPanel").then((m) => ({ default: m.ConstructorPanel })),
);
const ConstructorDeckGrid = lazy(() =>
  import("@/components/decks/ConstructorPanel").then((m) => ({ default: m.ConstructorDeckGrid })),
);
const MetaPanel = lazy(() =>
  import("@/components/decks/MetaPanel").then((m) => ({ default: m.MetaPanel })),
);

function TabSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader variant="section" />}>{children}</Suspense>;
}

const DECK_HOME = "stats";

const DECK_NAV = [
  { id: "top", label: DECK_FILTER_LABELS.top, emoji: "👑" },
  { id: "constructor", label: DECK_FILTER_LABELS["constructor"], emoji: "🛠️" },
  { id: "arena", label: DECK_FILTER_LABELS.arena, emoji: "🏟️" },
  { id: "favorites", label: DECK_FILTER_LABELS.favorites, emoji: "⭐" },
  { id: "meta", label: DECK_FILTER_LABELS.meta, emoji: "🔥" },
  { id: "random", label: DECK_FILTER_LABELS.random, emoji: "🎲" },
] as const;

const VALID_FILTERS = new Set<string>([DECK_HOME, "mine", ...DECK_NAV.map((item) => item.id)]);

function filterFromTab(tab: string | null): string {
  if (!tab) return DECK_HOME;
  return VALID_FILTERS.has(tab) ? tab : DECK_HOME;
}

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

function DeckCardsGrid({ cards, useVariants = false }: { cards: DeckCardData[]; useVariants?: boolean }) {
  if (useVariants) {
    return (
      <Suspense fallback={null}>
        <ConstructorDeckGrid cards={cards} />
      </Suspense>
    );
  }
  return <PlayerDeckGrid cards={cards} size="lg" showLabels className="mb-4" />;
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
      filter === "favorites" ||
      filter === "meta"
    ) {
      setLoading(false);
      setDecks([]);
      setError(null);
      setMetaUpdatedAt(null);
      return;
    }
    const cacheKey = filter === "mine" ? "decks:mine-v5" : `decks:${filter}`;
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
      <PageHeader
        title="Колоды"
        subtitle={
          <p className="decks-tab-description text-sm">
            {filter === DECK_HOME ? (
              "До 10 последних сыгранных колод: винрейт и бои считаются постоянно. Новая колода заменяет ту, у которой меньше всего боёв."
            ) : filter === "meta" ? (
              <>Актуальные колоды сильнейших игроков</>
            ) : filter === "top" ? (
              "Топ-10 игроков из глобального списка лидеров (Легендарный путь): колода, винрейт на ней и кубки."
            ) : filter === "arena" ? (
              "Колоды соперников с вашей арены: винрейт и число боёв, когда данные доступны."
            ) : filter === "constructor" ? (
              "Собери основу — Ghosteek достроит колоду."
            ) : filter === "mine" ? (
              "Ваши колоды из истории боёв. Нажмите «Статистика» для разбора матчапов и советов."
            ) : filter === "favorites" ? (
              "Сохранённые колоды — быстрый доступ к избранным сборкам."
            ) : (
              "Случайная колода из 8 карт."
            )}
          </p>
        }
        action={
          <span className="wallpaper-plain-text text-base">
            {filter === DECK_HOME
              ? "Мои колоды"
              : filter === "random"
              ? "Генератор"
              : filter === "constructor"
                ? "Билдер"
                : filter === "top"
                ? "Рейтинг"
                : filter === "arena"
                  ? "Арена"
                  : filter === "favorites"
                  ? "Избранное"
                  : filter === "meta"
                    ? "Мета"
                  : `${decks.length} колод`}
          </span>
        }
      />

      <FeatureNavGrid items={[...DECK_NAV]} activeId={navActiveId} onSelect={handleNavSelect} />

      {copyHint && (
        <Card className="text-center text-cr-win text-base">{copyHint}</Card>
      )}

      {error && filter !== "meta" && <ErrorState title={error} />}

      {loading &&
      filter !== DECK_HOME &&
      filter !== "random" &&
      filter !== "top" &&
      filter !== "arena" &&
      filter !== "constructor" &&
      filter !== "favorites" &&
      filter !== "meta" ? (
        <Loader variant="section" />
      ) : null}

      {filter === DECK_HOME ? <DeckWinratesPanel onAnalyze={setPassportDeck} /> : null}

      {filter === "favorites" ? (
        <TabSuspense>
          <FavoritesPanel
            onAnalyze={setPassportDeck}
            onCompare={(deck) => {
              const path = deckToComparePath(deck, "favorites");
              if (path) navigate(path);
            }}
          />
        </TabSuspense>
      ) : null}

      {filter === "random" ? (
        <RandomDeckPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
          onAnalyze={setPassportDeck}
          onCompare={(deck) => {
            const path = deckToComparePath(deck, "random");
            if (path) navigate(path);
          }}
        />
      ) : null}

      {filter === "top" ? (
        <TopPlayersPanel
          onCopied={(msg) => {
            setCopyHint(msg);
            setTimeout(() => setCopyHint(null), 3000);
          }}
          onAnalyze={setPassportDeck}
          onCompare={(deck) => {
            const path = deckToComparePath(deck, "top");
            if (path) navigate(path);
          }}
        />
      ) : null}

      {filter === "constructor" ? (
        <TabSuspense>
          <ConstructorPanel
            renderDeckCard={(deck, i) => (
              <div key={`${deck.id}-${deck.name}`} className="w-full">
                <DeckCard
                  deck={deck}
                  index={i}
                  showCompare
                  onCompare={() => {
                    const path = deckToComparePath(deck, "constructor");
                    if (path) navigate(path);
                  }}
                  onCopied={(msg) => {
                    setCopyHint(msg);
                    setTimeout(() => setCopyHint(null), 3000);
                  }}
                  onAnalyze={() => setPassportDeck(deck)}
                  onAskAi={() => {
                    const names = (deck.cards ?? []).map((c) => c.name).filter(Boolean);
                    if (names.length < 8) return;
                    openGhosteekAi(navigate, contextFromConstructor(names));
                  }}
                />
              </div>
            )}
          />
        </TabSuspense>
      ) : null}

      {filter === "arena" ? (
        <TabSuspense>
          <ArenaDecksPanel
            renderDeck={(deck, i, onCompare) => (
              <DeckCard
                deck={deck}
                index={i}
                showCompare
                onCompare={onCompare}
                onCopied={(msg) => {
                  setCopyHint(msg);
                  setTimeout(() => setCopyHint(null), 3000);
                }}
                onAnalyze={() => setPassportDeck(deck)}
              />
            )}
          />
        </TabSuspense>
      ) : null}

      {filter === "meta" ? (
        <TabSuspense>
          <MetaPanel />
        </TabSuspense>
      ) : null}

      {filter === "mine" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full overflow-x-hidden">
          {decks.map((deck, i) => {
            const canCompare = deck.type !== "mine" && (deck.cards?.length ?? 0) === 8;
            return (
            <div key={`${deck.id}-${deck.name}`} className="w-full">
              <DeckCard
                deck={deck}
                index={i}
                showCompare={canCompare}
                onCompare={
                  canCompare
                    ? () => {
                        const path = deckToComparePath(deck, filter);
                        if (path) navigate(path);
                      }
                    : undefined
                }
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
            );
          })}
          {!error && decks.length === 0 && !loading ? (
            <EmptyState
              icon={<SlidersHorizontal className="h-12 w-12 opacity-50" />}
              title="Колоды не найдены"
              description="Сыграйте бои для раздела «Мои»"
              className="col-span-full"
            />
          ) : null}
        </div>
      )}

      <DeckPassport deck={passportDeck} onClose={() => setPassportDeck(null)} />

      <ScrollToTopButton />
    </div>
  );
}

export { DecksPage as default };

function TopPlayersPanel({
  onCopied,
  onAnalyze,
  onCompare,
}: {
  onCopied: (msg: string) => void;
  onAnalyze: (deck: Deck) => void;
  onCompare: (deck: Deck) => void;
}) {
  const { openLink } = useTelegram();
  const [players, setPlayers] = useState<TopPlayer[]>(() => {
    const hit = cacheGet<TopPlayersData>("top-players-v3");
    return hit?.players ?? [];
  });
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    () => cacheGet<TopPlayersData>("top-players-v3")?.updated_at ?? null,
  );
  const [loading, setLoading] = useState(() => !cacheHas("top-players-v3"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cacheHas("top-players-v3")) {
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

  if (loading) return <Loader variant="section" />;

  if (error) {
    return (
      <ErrorState title={error} button="Попробовать снова" onAction={() => void load()} />
    );
  }

  if (!players.length) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12 opacity-50" />}
        title="Рейтинг временно недоступен"
        description="Попробуйте позже"
      />
    );
  }

  const updatedLabel = formatUpdatedAt(updatedAt);

  return (
    <div className="space-y-4">
      {updatedLabel && (
        <p className="text-sm text-cr-muted text-center">Обновлено: {updatedLabel}</p>
      )}
      {players.map((player, i) => (
        <div key={player.player_tag} className="ui-enter" style={{ animationDelay: `${i * 40}ms` }}>
          <Card noMotion>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-cr-gold bg-cr-gold/10 px-2 py-0.5 rounded-full border border-cr-gold/20">
                    #{player.rank}
                  </span>
                  <h3 className="text-base font-semibold text-cr-text truncate">{player.player_name}</h3>
                </div>
                <p className="text-sm text-cr-muted truncate">
                  #{player.player_tag}
                  {player.clan_name ? ` · ${player.clan_name}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-sm text-cr-muted">
                  <Trophy className="w-3.5 h-3.5 text-cr-gold" />
                  <span className="font-semibold text-cr-text">{player.trophies}</span>
                </div>
                <p className={"text-sm font-bold mt-0.5 " + (player.total_games > 0 ? (player.winrate >= 50 ? "text-cr-win" : "text-cr-loss") : "text-cr-muted")}>
                  {player.total_games > 0
                    ? `${UI.winrateShort} ${player.winrate.toFixed(0)}%`
                    : "Винрейт: н/д"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm mb-3">
              <ElixirIcon size={14} />
              <span className="font-semibold text-cr-text">{player.avg_elixir.toFixed(1)}</span>
              {player.total_games > 0 ? (
                <span className="text-cr-muted ml-2">{player.total_games} {UI.battles}</span>
              ) : null}
            </div>

            <DeckCardsGrid cards={player.cards} />

            {player.cards.length === 8 ? (
              <div className="grid grid-cols-2 gap-2 mt-0 mb-2">
                <Button
                  variant="secondary"
                  className="!py-2 text-base flex items-center justify-center gap-2"
                  onClick={() => {
                    const deck = deckFromCardNames(
                      player.cards.map((c) => c.name),
                      {
                        id: player.rank,
                        name: `${player.player_name} · #${player.rank}`,
                        avgElixir: player.avg_elixir,
                        winrate: player.winrate,
                        totalGames: player.total_games,
                        type: "meta",
                        deckLink: player.deck_link,
                      },
                    );
                    if (!deck) return;
                    deck.cards = player.cards.map((c, slot) => ({ ...c, slot }));
                    onAnalyze(deck);
                  }}
                >
                  <ScanSearch className="w-4 h-4" />
                  Анализ
                </Button>
                <Button
                  variant="secondary"
                  className="!py-2 text-base flex items-center justify-center gap-2"
                  onClick={() => {
                    const deck = deckFromCardNames(
                      player.cards.map((c) => c.name),
                      {
                        id: player.rank,
                        name: `${player.player_name} · #${player.rank}`,
                        avgElixir: player.avg_elixir,
                        winrate: player.winrate,
                        totalGames: player.total_games,
                        type: "meta",
                        deckLink: player.deck_link,
                      },
                    );
                    if (!deck) return;
                    deck.cards = player.cards.map((c, slot) => ({ ...c, slot }));
                    onCompare(deck);
                  }}
                >
                  <Swords className="w-4 h-4" />
                  Сравнить
                </Button>
              </div>
            ) : null}

            <div className="flex gap-2 mt-0">
              {player.deck_link ? (
                <Button
                  variant="secondary"
                  className="flex-1 !py-2 text-base flex items-center justify-center gap-2"
                  onClick={() => void importDeck(player.deck_link)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Импорт колоды
                </Button>
              ) : (
                <p className="flex-1 text-sm text-cr-muted text-center self-center">
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
        </div>
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
          <span className="text-base font-medium text-cr-text flex items-center gap-1.5">
            <span aria-hidden>🤡</span>
            Рофл
          </span>
          <button
            type="button"
            aria-label="Что такое режим Рофл"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((v) => !v)}
            className="w-6 h-6 shrink-0 rounded-full border border-cr-border bg-cr-card/60 text-sm font-bold text-cr-muted transition-colors"
          >
            ?
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rofl}
          aria-label="Режим Рофл"
          data-checked={rofl}
          onClick={() => onRoflChange(!rofl)}
          className="toggle-switch"
        >
          <span className="toggle-switch-thumb" />
        </button>
      </div>
      {showHelp ? (
        <p className="text-sm text-cr-muted leading-snug px-0.5">
          Готовые абсурдные колоды. Не мета. Не скилл. Просто рофл.
          <br />
          Обычный рандом рядом не трогали — выключи тумблер и всё как было.
        </p>
      ) : null}
      {rofl ? (
        <p className="text-xs text-cr-gold/90 leading-snug px-0.5">
          Режим «Рофл» · жми «Заново», если не смешно
        </p>
      ) : null}
    </div>
  );
}

function RandomDeckPanel({
  onCopied,
  onAnalyze,
  onCompare,
}: {
  onCopied: (msg: string) => void;
  onAnalyze: (deck: Deck) => void;
  onCompare: (deck: Deck) => void;
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
        <Loader variant="section" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="space-y-3">
        <RoflModeBar rofl={rofl} onRoflChange={setRofl} />
        <ErrorState
          title={error ?? "Ошибка"}
          button="Попробовать снова"
          onAction={() => void roll()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 ui-enter">
      <RoflModeBar rofl={rofl} onRoflChange={setRofl} />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span
            className={
              "text-sm font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 " +
              (deck.rofl
                ? "text-cr-gold bg-cr-gold/15 border-cr-gold/35"
                : "text-cr-gold bg-cr-gold/10 border-cr-gold/20")
            }
          >
            {deck.rofl ? <span aria-hidden>🤡</span> : <Shuffle className="w-3 h-3" />}
            {deck.rofl ? (deck.rofl_name ?? "Рофл") : "Случайная колода"}
          </span>
          <div className="flex items-center gap-1 text-sm shrink-0">
            <ElixirIcon size={14} />
            <span className="font-semibold text-cr-text">{deck.avg_elixir.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-sm text-cr-muted mb-4">
          {deck.rofl
            ? (deck.rofl_tagline ?? "не задавай вопросов")
            : "8 случайных карт, как в игре. Нажмите «Заново», если колода не нравится."}
        </p>

        <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-3 mb-4">
          {deck.card_infos.map((card, i) => (
            <div key={card.id} className="min-w-0 overflow-visible">
              <CardTile name={card.name} icon={card.icon} size="lg" showLabel />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {deck.cards.length === 8 ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="!py-2 text-base flex items-center justify-center gap-2"
                onClick={() => {
                  const payload: Deck = {
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
                  };
                  onAnalyze(payload);
                }}
              >
                <ScanSearch className="w-4 h-4" />
                Анализ
              </Button>
              <Button
                variant="secondary"
                className="!py-2 text-base flex items-center justify-center gap-2"
                onClick={() => {
                  const payload: Deck = {
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
                  };
                  onCompare(payload);
                }}
              >
                <Swords className="w-4 h-4" />
                Сравнить
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-stretch">
            <Button
              variant="secondary"
              className="min-w-0 !px-2.5 !py-2 text-sm sm:text-base flex items-center justify-center gap-1.5"
              onClick={() => void roll()}
              disabled={loading}
            >
              <RefreshCw className={"w-4 h-4 shrink-0 " + (loading ? "animate-spin" : "")} />
              <span className="truncate">Заново</span>
            </Button>
            {deck.deck_link ? (
              <Button
                variant="secondary"
                className="min-w-0 !px-2.5 !py-2 text-sm sm:text-base flex items-center justify-center gap-1.5"
                onClick={() => void importDeck()}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">В игру</span>
              </Button>
            ) : (
              <div />
            )}
            {deck.cards.length === 8 ? (
              <FavoriteDeckButton cards={deck.cards} onMessage={onCopied} />
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DeckCard({
  deck,
  index,
  onCopied,
  showCompare = false,
  onCompare,
  onOpenStats,
  onAnalyze,
  onAskAi,
}: {
  deck: Deck;
  index: number;
  onCopied: (msg: string) => void;
  showCompare?: boolean;
  onCompare?: () => void;
  onOpenStats?: () => void;
  onAnalyze?: () => void;
  onAskAi?: () => void;
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
    <div className="group">
      <Card className="overflow-hidden" noMotion>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-cr-blue bg-cr-blue/10 px-2.5 py-1 rounded-full border border-cr-blue/20">
            {CATEGORY_LABELS[category] ?? category}
          </span>
          <div className="flex items-center gap-1 text-sm">
            <ElixirIcon size={14} />
            <span className="font-semibold text-cr-text">{avgElixir.toFixed(1)}</span>
          </div>
        </div>

        {deck.name && (
          <h3 className="text-base font-semibold text-cr-text mb-1">{deck.name}</h3>
        )}
        {deck.description && (
          <p className="text-sm text-cr-muted mb-3">{deck.description}</p>
        )}

        <DeckCardsGrid cards={cards} useVariants={deck.type === "constructor"} />

        {deck.type === "meta" && deck.total_games > 0 && (
          <div className="flex items-center justify-between text-base mb-3">
            <span className="text-cr-muted">{UI.winrate} топов</span>
            <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
              {winrate.toFixed(1)}%
            </span>
          </div>
        )}

        {deck.type === "mine" && (
          <>
            <div className="flex items-center justify-between text-base">
              <span className="text-cr-muted">{UI.winrate}</span>
              <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
                {winrate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-base mt-1 mb-3">
              <span className="text-cr-muted">{UI.games}</span>
              <span className="font-semibold text-cr-text">{deck.total_games ?? 0}</span>
            </div>
          </>
        )}

        {deck.type === "constructor" && (
          <>
            <div className="flex items-center justify-between text-base mb-2">
              <span className="text-cr-muted">Синергия</span>
              <span className="font-bold text-cr-gold">
                {(deck.synergy_score ?? deck.winrate).toFixed(0)}%
              </span>
            </div>
            {deck.synergy_notes && deck.synergy_notes.length > 0 ? (
              <ul className="text-xs text-cr-muted space-y-0.5 mb-3">
                {deck.synergy_notes.slice(0, 2).map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            ) : null}
            <DecisionExplanationView
              explanation={deck.recommendation?.decision_explanation}
              coaching={deck.recommendation?.coaching}
              showSwaps={false}
              title=""
              className="mb-3"
            />
          </>
        )}

        {deck.type === "arena" && (
          deck.total_games > 0 ? (
            <>
              <div className="flex items-center justify-between text-base">
                <span className="text-cr-muted">{UI.winrate}</span>
                <span className={"font-bold " + (winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
                  {winrate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-base mt-1 mb-3">
                <span className="text-cr-muted">{UI.games}</span>
                <span className="font-semibold text-cr-text">{deck.total_games ?? 0}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-cr-muted mb-3">Винрейт по боям пока недоступен · текущая колода TV Royale</p>
          )
        )}

        {deck.type === "mine" && onOpenStats ? (
          <Button
            variant="secondary"
            className="w-full !py-2 text-base flex items-center justify-center gap-2 mb-3"
            onClick={onOpenStats}
          >
            <BarChart3 className="w-4 h-4" />
            Статистика колоды
          </Button>
        ) : null}

        {canFavorite && (onAnalyze || (showCompare && onCompare) || onAskAi) ? (
          <div
            className={
              "grid gap-2 mb-3 " +
              (
                [onAnalyze, showCompare && onCompare, onAskAi].filter(Boolean).length >= 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
              )
            }
          >
            {onAnalyze ? (
              <Button
                variant="secondary"
                className="!py-2 text-base flex items-center justify-center gap-2"
                onClick={onAnalyze}
              >
                <ScanSearch className="w-4 h-4" />
                Анализ
              </Button>
            ) : null}
            {showCompare && onCompare ? (
              <Button
                variant="secondary"
                className="!py-2 text-base flex items-center justify-center gap-2"
                onClick={onCompare}
              >
                <Swords className="w-4 h-4" />
                {onAnalyze ? "Сравнить" : "Сравнить с моей"}
              </Button>
            ) : null}
            {onAskAi ? (
              <Button
                variant="secondary"
                className="!py-2 text-base flex items-center justify-center gap-2 col-span-full"
                onClick={onAskAi}
              >
                <Bot className="w-4 h-4" />
                Спросить Ghosteek
              </Button>
            ) : null}
          </div>
        ) : null}

        {canImport || canFavorite ? (
          <div className="flex gap-2">
            {canImport ? (
              <Button
                variant="secondary"
                className="flex-1 !py-2 text-base flex items-center justify-center gap-2"
                onClick={() => void importDeck()}
              >
                <ExternalLink className="w-4 h-4" />
                Импорт в игру
              </Button>
            ) : (
              <p className="flex-1 text-sm text-cr-muted text-center self-center leading-snug px-1">
                Импорт недоступен — не все карты распознаны
              </p>
            )}
            {canFavorite ? (
              <FavoriteDeckButton cards={cardNames} onMessage={onCopied} />
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
