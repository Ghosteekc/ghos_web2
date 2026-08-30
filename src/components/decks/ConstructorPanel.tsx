import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { motionTween } from "@/motion";
import { HelpCircle, Search, Sparkles, X } from "lucide-react";

import { api } from "@/api/client";
import { Card, Button, Loader, ErrorState, EmptyState } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { useCardCatalog } from "@/hooks";
import {
  fetchConstructorDecks,
  constructorApiErrorMessage,
} from "@/services/constructorAdapter";
import { WIN_CONDITIONS } from "@/services/deckBuilder/constants";
import { cardHasRole, getCardMeta } from "@/services/deckBuilder/database";
import { CHAMPION_CARDS } from "@/analytics/deckPassport/constants/ratings";
import { cn } from "@/utils";
import { haptic } from "@/utils/hapticManager";
import type { CardDisplayMode, CoreConflictInfo, Deck, DeckCard } from "@/types";

/** Подписи слотов: 0 evo, 1 hero|champion, 2 hybrid, 3 base. */
const SLOT_HINTS: ReadonlyArray<string | readonly string[]> = [
  "Эволюция",
  ["Герой", "Чемпион"],
  "Гибрид",
  "Обычная",
];

type BrowserTab = "all" | "troop" | "spell" | "building" | "champion" | "evo";

const BROWSER_TABS: { id: BrowserTab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "troop", label: "Войска" },
  { id: "spell", label: "Заклинания" },
  { id: "building", label: "Здания" },
  { id: "champion", label: "Чемпионы" },
  { id: "evo", label: "Эволюции" },
];

type SlotPick = { name: string; slot: number } | null;

const CTOR_SESSION_KEY = "ghosteek:ctor-core-v1";

function readCtorSession(): { slots: SlotPick[]; activeSlot: number } | null {
  try {
    const raw = sessionStorage.getItem(CTOR_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { slots?: SlotPick[]; activeSlot?: number };
    if (!Array.isArray(parsed.slots) || parsed.slots.length !== 4) return null;
    return {
      slots: parsed.slots,
      activeSlot: Math.min(3, Math.max(0, Number(parsed.activeSlot) || 0)),
    };
  } catch {
    return null;
  }
}

function writeCtorSession(slots: SlotPick[], activeSlot: number) {
  try {
    sessionStorage.setItem(CTOR_SESSION_KEY, JSON.stringify({ slots, activeSlot }));
  } catch {
    /* ignore quota */
  }
}

type CatalogCard = {
  name: string;
  name_ru: string;
  name_short?: string;
  icon: string;
  id?: number | null;
  elixir?: number | null;
  max_evolution_level?: number;
  has_hero?: boolean;
  icon_evo?: string;
  icon_hero?: string;
};

/**
 * Режим арта в слоте:
 * 0 — только эволюция
 * 1 — только чемпион / героизм
 * 2 — гибрид: чемпион / героизм / эволюция
 * 3 — обычная, без улучшений
 */
function isChampionCard(card: CatalogCard): boolean {
  return CHAMPION_CARDS.has(card.name);
}

function isHeroCard(card: CatalogCard): boolean {
  return Boolean(card.has_hero);
}

function isEvoCard(card: CatalogCard): boolean {
  return Boolean(card.icon_evo);
}

function cardFitsSlot(slotIndex: number, card: CatalogCard): boolean {
  switch (slotIndex) {
    case 0:
      return isEvoCard(card);
    case 1:
      return isChampionCard(card) || isHeroCard(card);
    case 2:
      return isChampionCard(card) || isHeroCard(card) || isEvoCard(card);
    case 3:
      return true;
    default:
      return false;
  }
}

function slotDisplayMode(slotIndex: number, card: CatalogCard): CardDisplayMode {
  if (slotIndex === 0) {
    return isEvoCard(card) ? "evo" : "base";
  }

  if (slotIndex === 1) {
    if (isChampionCard(card)) return "base";
    if (isHeroCard(card)) return "hero";
    return "base";
  }

  if (slotIndex === 2) {
    if (isChampionCard(card)) return "base";
    if (isHeroCard(card)) return "hero";
    if (isEvoCard(card)) return "evo";
    return "base";
  }

  // Слот 4 — без улучшений
  return "base";
}

function slotCardProps(slotIndex: number, card: CatalogCard) {
  const mode = slotDisplayMode(slotIndex, card);
  const isChampion = CHAMPION_CARDS.has(card.name);
  return {
    displayMode: mode,
    rarity: isChampion ? "champion" : undefined,
    iconBase: card.icon,
    iconEvo: card.icon_evo || card.icon,
    iconHero: card.icon_hero || card.icon,
    icon:
      mode === "evo"
        ? card.icon_evo || card.icon
        : mode === "hero"
          ? card.icon_hero || card.icon
          : card.icon,
    evolution_level: mode === "evo" ? 1 : 0,
    is_hero: mode === "hero",
  };
}

function slotIconUrl(slotIndex: number, card: CatalogCard): string {
  return String(slotCardProps(slotIndex, card).icon || card.icon || "");
}

/** Только карты с реальной эволюцией — без героев и чемпионов. */
function isEvolutionCard(card: CatalogCard): boolean {
  if (!card.icon_evo) return false;
  if (CHAMPION_CARDS.has(card.name)) return false;
  return true;
}

function matchesBrowserTab(card: CatalogCard, tab: BrowserTab): boolean {
  if (tab === "all") return true;
  if (tab === "champion") return CHAMPION_CARDS.has(card.name);
  if (tab === "evo") return isEvolutionCard(card);
  const meta = getCardMeta(card.name);
  const type = meta?.type ?? "troop";
  return type === tab;
}

/** Короткая подсказка Ghosteek — только UX, не влияет на сборку. */
function ghosteekRecommendation(names: string[]): string {
  if (names.length === 0) return "Ниже выбери любимую карту";

  const hasWin = names.some(
    (n) => WIN_CONDITIONS.has(n) || cardHasRole(n, "win_condition"),
  );
  const hasAir = names.some((n) => cardHasRole(n, "air_defense"));
  const hasSpell = names.some((n) => cardHasRole(n, "spell") || getCardMeta(n)?.type === "spell");
  const hasBuilding = names.some(
    (n) => cardHasRole(n, "building") || getCardMeta(n)?.type === "building",
  );
  const winCount = names.filter(
    (n) => WIN_CONDITIONS.has(n) || cardHasRole(n, "win_condition"),
  ).length;

  if (names.length === 1 && hasWin) {
    return "Отличное начало. Попробуй добавить вторую вин-карту.";
  }
  if (names.length === 1 && !hasWin) {
    return "Сильный старт. Добавь вин-карту — карту, которая ломает башни.";
  }
  if (names.length >= 2 && !hasWin) {
    return "Добавь вин-карту — основу атаки колоды.";
  }
  if (winCount >= 2 && !hasAir) {
    return "Добавь карту защиты от воздуха.";
  }
  if (names.length >= 2 && !hasSpell) {
    return "Заклинание поможет закрыть слабые матчапы.";
  }
  if (names.length >= 3 && !hasBuilding && hasWin) {
    return "Здание усилит защиту и контроль темпа.";
  }
  if (names.length >= 3) {
    return "Ядро почти готово. Добери последнюю карту.";
  }
  return "Хороший выбор. Продолжай собирать основу.";
}

function ConstructorHelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="ctor-sheet-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ctor-help-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionTween.fast}
    >
      <button type="button" className="ctor-sheet-backdrop" aria-label="Закрыть" onClick={onClose} />
      <motion.div
        className="ctor-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={motionTween.slow}
      >
        <div className="ctor-sheet-handle" aria-hidden />
        <h2 id="ctor-help-title" className="ctor-sheet-title">
          Как пользоваться
        </h2>
        <ul className="ctor-sheet-list">
          <li>Нажми слот — он станет активным.</li>
          <li>Выбери карту внизу — она встанет в этот слот.</li>
          <li>
            Слот 1 — только эволюция, слот 2 — только герой или чемпион, слот 3 —
            гибрид (эволюция / героизм / чемпион), слот 4 — обычная карта без
            улучшений.
          </li>
          <li>Когда все 4 карты на месте, Ghosteek соберёт полные колоды.</li>
        </ul>
        <Button variant="primary" className="w-full mt-4" onClick={onClose}>
          Понятно
        </Button>
      </motion.div>
    </motion.div>
  );
}

interface ConstructorPanelProps {
  renderDeckCard: (deck: Deck, index: number) => ReactNode;
}

export function ConstructorPanel({ renderDeckCard }: ConstructorPanelProps) {
  const { ready, getCard, nameRu } = useCardCatalog();
  const saved = useMemo(() => readCtorSession(), []);
  const [slots, setSlots] = useState<(SlotPick)[]>(
    () => saved?.slots ?? [null, null, null, null],
  );
  const [activeSlot, setActiveSlot] = useState(() => saved?.activeSlot ?? 0);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [browserTab, setBrowserTab] = useState<BrowserTab>("all");
  /** Если true — в браузере только карты, подходящие под активный слот (evo/hero/…). */
  const [slotFilterOnly, setSlotFilterOnly] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [alternativeDeck, setAlternativeDeck] = useState<Deck | null>(null);
  const [coreConflict, setCoreConflict] = useState<CoreConflictInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    writeCtorSession(slots, activeSlot);
  }, [slots, activeSlot]);

  useEffect(() => {
    if (!ready) return;
    void api
      .getCardCatalog()
      .then((res) => {
        setCatalog(
          res.cards.map((c) => ({
            name: c.name,
            name_ru: c.name_ru,
            name_short: c.name_short,
            icon: c.icon,
            id: c.id,
            elixir: c.elixir,
            max_evolution_level: c.max_evolution_level,
            has_hero: c.has_hero,
            icon_evo: c.icon_evo,
            icon_hero: c.icon_hero,
          })),
        );
      })
      .catch(() => {});
  }, [ready]);

  const filledCount = slots.filter(Boolean).length;

  const usedNames = useMemo(
    () => new Set(slots.filter((s): s is NonNullable<SlotPick> => Boolean(s)).map((s) => s.name)),
    [slots],
  );

  const selectedNames = useMemo(
    () => slots.filter((s): s is NonNullable<SlotPick> => Boolean(s)).map((s) => s.name),
    [slots],
  );

  const tip = useMemo(() => ghosteekRecommendation(selectedNames), [selectedNames]);

  const filteredCards = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return catalog
      .filter((c) => {
        if (!matchesBrowserTab(c, browserTab)) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.name_ru.toLowerCase().includes(q) ||
          (c.name_short ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.elixir ?? 99) - (b.elixir ?? 99) || a.name.localeCompare(b.name));
  }, [catalog, deferredSearch, browserTab]);

  const buildRequestRef = useRef(0);
  const buildDecks = useCallback(async (current: (SlotPick)[]) => {
    const picks = current.filter((s): s is NonNullable<SlotPick> => Boolean(s));
    if (picks.length !== 4) {
      setDecks([]);
      setAlternativeDeck(null);
      setCoreConflict(null);
      return;
    }

    const requestId = ++buildRequestRef.current;
    setLoading(true);
    setError(null);

    try {
      const payload = picks
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((p) => ({ name: p.name, slot: p.slot }));
      const built = await fetchConstructorDecks(payload);
      if (requestId !== buildRequestRef.current) return;
      setDecks(built.decks);
      setAlternativeDeck(built.alternativeDeck);
      setCoreConflict(built.coreConflict ?? null);
    } catch (e) {
      if (requestId !== buildRequestRef.current) return;
      setDecks([]);
      setAlternativeDeck(null);
      setCoreConflict(null);
      setError(constructorApiErrorMessage(e));
    } finally {
      if (requestId === buildRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (filledCount !== 4) {
      setDecks([]);
      setAlternativeDeck(null);
      setCoreConflict(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      void buildDecks(slots);
    }, 200);

    return () => clearTimeout(timer);
  }, [slots, filledCount, buildDecks]);

  const placeCard = (card: CatalogCard) => {
    haptic.light();
    const targetSlot = activeSlot;
    setSlots((prev) => {
      const next = [...prev];
      next[targetSlot] = { name: card.name, slot: targetSlot };
      const nextEmpty = next.findIndex((s, i) => !s && i !== targetSlot);
      if (nextEmpty >= 0) setActiveSlot(nextEmpty);
      return next;
    });
  };

  const clearSlot = (index: number) => {
    haptic.light();
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setActiveSlot(index);
  };

  const resetAll = () => {
    setSlots([null, null, null, null]);
    setActiveSlot(0);
    setDecks([]);
    setAlternativeDeck(null);
    setCoreConflict(null);
    setError(null);
    try {
      sessionStorage.removeItem(CTOR_SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  if (!ready && !catalog.length) {
    return <Loader variant="section" />;
  }

  return (
      <div className="ctor">
        {/* 1. Header */}
        <header className="ctor-header">
          <div className="ctor-header-copy">
            <h2 className="ctor-title">Основа колоды</h2>
            <p className="ctor-subtitle">Выбери 4 ключевые карты</p>
          </div>
          <button
            type="button"
            className="ctor-help-btn"
            aria-label="Как пользоваться"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </header>

        {/* 2. Core Builder */}
        <section className="ctor-core constructor-seed-card glass-card">
          <div className="ctor-slots">
            {slots.map((pick, index) => {
              const card = pick
                ? (catalog.find((c) => c.name === pick.name) ?? getCard(pick.name))
                : null;
              const isActive = activeSlot === index;
              const isDim = !isActive;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveSlot(index)}
                  className={cn(
                    "ctor-slot constructor-slot",
                    isActive && "ctor-slot--active constructor-slot--active",
                    isDim && "ctor-slot--dim",
                    !card && "ctor-slot--empty",
                  )}
                >
                  <span
                    className={cn(
                      "ctor-slot-label",
                      Array.isArray(SLOT_HINTS[index]) && "ctor-slot-label--stack",
                    )}
                  >
                    {Array.isArray(SLOT_HINTS[index])
                      ? (SLOT_HINTS[index] as readonly string[]).map((line) => (
                          <span key={line} className="ctor-slot-label-line">
                            {line}
                          </span>
                        ))
                      : SLOT_HINTS[index]}
                  </span>

                  <div className="ctor-slot-well">
                    {card ? (
                      <div
                        key={card.name}
                        className="ctor-slot-card ctor-slot-card--enter"
                      >
                        <CardTile
                          name={card.name}
                          size="deck"
                          {...slotCardProps(index, card as CatalogCard)}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSlot(index);
                          }}
                          className="ctor-slot-clear"
                          aria-label="Убрать карту"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="ctor-slot-placeholder">
                        <span className="ctor-slot-plus">+</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="ctor-below">
        <Button
          type="button"
          variant="secondary"
          className="ctor-reset w-full"
          onClick={resetAll}
          disabled={filledCount === 0}
        >
          Сбросить выбор карт
        </Button>

        <p className="ctor-tip glass-card">
          <Sparkles className="ctor-tip-icon" aria-hidden />
          <span>{tip}</span>
        </p>

        <div className="ctor-stage">
        {loading ? (
          <p className="ctor-loading-hint">Собираем колоды…</p>
        ) : null}

        {/* 3. Card Browser */}
        {filledCount < 4 ? (
          <section className="ctor-browser">
            <div className="ctor-search">
              <Search className="ctor-search-icon" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск карты…"
                className="ctor-search-input"
              />
            </div>

            <label className="ctor-slot-filter">
              <input
                type="checkbox"
                checked={slotFilterOnly}
                onChange={(e) => {
                  haptic.selection();
                  setSlotFilterOnly(e.target.checked);
                }}
              />
              <span>Только под слот</span>
            </label>

            <div className="ctor-tabs" role="tablist" aria-label="Тип карты">
              {BROWSER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={browserTab === tab.id}
                  className={cn("ctor-tab", browserTab === tab.id && "ctor-tab--active")}
                  onClick={() => setBrowserTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={cn("ctor-grid", browserTab === "evo" && "ctor-grid--evo")}>
              {filteredCards.map((card) => {
                const used = usedNames.has(card.name);
                const unfit = slotFilterOnly && !cardFitsSlot(activeSlot, card);
                const blocked = used || unfit;
                return (
                <button
                  key={card.id != null ? String(card.id) : card.name}
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    if (blocked) return;
                    placeCard(card);
                  }}
                  className={cn(
                    "ctor-grid-item",
                    browserTab === "evo" && "ctor-grid-item--evo",
                    used && "ctor-grid-item--used",
                    unfit && !used && "ctor-grid-item--unfit",
                  )}
                  title={nameRu(card.name)}
                  aria-disabled={blocked}
                >
                  {browserTab === "evo" ? (
                    <CardTile
                      name={card.name}
                      icon={card.icon_evo || card.icon}
                      iconBase={card.icon}
                      iconEvo={card.icon_evo || card.icon}
                      displayMode="evo"
                      size="collection"
                      showLabel
                      elixirCost={card.elixir ?? undefined}
                    />
                  ) : (
                    <CardTile
                      name={card.name}
                      icon={card.icon}
                      size="collection"
                      showLabel
                      elixirCost={card.elixir ?? undefined}
                    />
                  )}
                </button>
                );
              })}
            </div>

            {filteredCards.length === 0 ? <EmptyState title="Карты не найдены" /> : null}

            <p className="ctor-progress">
              Ещё {4 - filledCount} {4 - filledCount === 1 ? "карта" : "карты"}
            </p>
          </section>
        ) : null}

        {loading ? <Loader variant="section" compact label="Собираем колоды…" /> : null}
        {error ? <ErrorState title={error} /> : null}

        {!loading && filledCount === 4 && decks.length > 0 && !alternativeDeck ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cr-gold" />
              <h3 className="text-base font-semibold text-cr-text">
                Варианты колод ({decks.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {decks.map((deck, i) => renderDeckCard(deck, i))}
            </div>
          </div>
        ) : null}

        {!loading && filledCount === 4 && coreConflict ? (
          <Card className="border border-cr-gold/30 bg-cr-gold/5 space-y-3">
            <h3 className="text-base font-semibold text-cr-text">Конфликт в ядре</h3>
            <p className="text-sm text-cr-text/90 whitespace-pre-line leading-relaxed">
              {coreConflict.message}
            </p>
            <p className="text-sm text-cr-muted">
              Конфликтующая карта:{" "}
              <span className="text-cr-gold font-semibold">
                {coreConflict.conflicting_card_ru || coreConflict.conflicting_card}
              </span>
              {coreConflict.quality_gain > 0
                ? ` · прирост качества ≈ ${Math.round(coreConflict.quality_gain)}`
                : null}
            </p>
          </Card>
        ) : null}

        {!loading && filledCount === 4 && alternativeDeck ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cr-accent" />
              <h3 className="text-base font-semibold text-cr-text">Альтернативный вариант</h3>
            </div>
            <p className="text-sm text-cr-muted">
              Это не основная сборка. Core без конфликтующей карты — выбор за вами.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {renderDeckCard(alternativeDeck, 0)}
            </div>
          </div>
        ) : null}

        {!loading &&
        filledCount === 4 &&
        !error &&
        decks.length === 0 &&
        !alternativeDeck &&
        !coreConflict ? (
          <EmptyState title="Не удалось подобрать колоды для этой комбинации" className="py-6" />
        ) : null}
        </div>
        </div>

        <AnimatePresence>
          {helpOpen ? <ConstructorHelpSheet onClose={() => setHelpOpen(false)} /> : null}
        </AnimatePresence>
      </div>
  );
}

export function ConstructorDeckGrid({ cards }: { cards: DeckCard[] }) {
  const sorted = [...cards].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-3 mb-4">
      {sorted.map((card) => (
        <div key={card.id || card.name} className="min-w-0 overflow-visible">
          <CardTile
            name={card.name}
            icon={card.icon}
            size="lg"
            showLabel
            displayMode={
              card.is_hero ? "hero" : (card.evolution_level ?? 0) >= 1 ? "evo" : "base"
            }
            iconEvo={card.icon}
            iconHero={card.icon}
            elixirCost={card.cost && card.cost > 0 ? card.cost : undefined}
          />
        </div>
      ))}
    </div>
  );
}
