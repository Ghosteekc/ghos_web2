import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Search, X, Sparkles, Wand2 } from "lucide-react";

import { api } from "@/api/client";

import { Card, Button, Loader, ErrorState, EmptyState } from "@/components/ui";

import { CardTile } from "@/components/cards";

import { useCardCatalog } from "@/hooks";

import {
  fetchConstructorDecks,
  constructorApiErrorMessage,
} from "@/services/constructorAdapter";

import type { CardDisplayMode, CoreConflictInfo, Deck, DeckCard } from "@/types";



const SLOT_HINTS = ["Эволюция", "Герой", "Эволюция", "Обычная"] as const;



type SlotPick = { name: string; slot: number } | null;



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



function slotDisplayMode(slotIndex: number, card: CatalogCard): CardDisplayMode {
  // Hero slot — only real heroes (heroMedium), not evo-only cards.
  if (slotIndex === 1 && card.has_hero) return "hero";
  // Evo slots — only cards with actual evolution art.
  // Hero-only cards (Magic Archer, Giant, …) have maxEvolutionLevel>=1 but no evo icon.
  if ((slotIndex === 0 || slotIndex === 2) && Boolean(card.icon_evo)) return "evo";
  return "base";
}



function slotCardProps(slotIndex: number, card: CatalogCard) {

  const mode = slotDisplayMode(slotIndex, card);

  return {

    displayMode: mode,

    iconBase: card.icon,

    iconEvo: card.icon_evo || card.icon,

    iconHero: card.icon_hero || card.icon,

    icon: mode === "evo" ? card.icon_evo || card.icon : mode === "hero" ? card.icon_hero || card.icon : card.icon,

    evolution_level: mode === "evo" ? 1 : 0,

    is_hero: mode === "hero",

  };

}



interface ConstructorPanelProps {

  renderDeckCard: (deck: Deck, index: number) => ReactNode;

}



export function ConstructorPanel({ renderDeckCard }: ConstructorPanelProps) {

  const { ready, getCard, nameRu } = useCardCatalog();

  const [slots, setSlots] = useState<(SlotPick)[]>([null, null, null, null]);

  const [activeSlot, setActiveSlot] = useState(0);

  const [search, setSearch] = useState("");

  const [catalog, setCatalog] = useState<CatalogCard[]>([]);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [alternativeDeck, setAlternativeDeck] = useState<Deck | null>(null);
  const [coreConflict, setCoreConflict] = useState<CoreConflictInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    if (!ready) return;

    void api.getCardCatalog().then((res) => {

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

    }).catch(() => {});

  }, [ready]);



  const filledCount = slots.filter(Boolean).length;



  const usedNames = useMemo(

    () => new Set(slots.filter((s): s is NonNullable<SlotPick> => Boolean(s)).map((s) => s.name)),

    [slots],

  );



  const filteredCards = useMemo(() => {

    const q = search.trim().toLowerCase();

    return catalog

      .filter((c) => {

        if (usedNames.has(c.name)) return false;

        if (!q) return true;

        return (

          c.name.toLowerCase().includes(q) ||

          c.name_ru.toLowerCase().includes(q) ||

          (c.name_short ?? "").toLowerCase().includes(q)

        );

      })

      .sort((a, b) => (a.elixir ?? 99) - (b.elixir ?? 99) || a.name.localeCompare(b.name));

  }, [catalog, search, usedNames]);



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

    setSlots((prev) => {

      const next = [...prev];

      next[activeSlot] = { name: card.name, slot: activeSlot };

      const nextEmpty = next.findIndex((s, i) => !s && i !== activeSlot);

      if (nextEmpty >= 0) setActiveSlot(nextEmpty);

      return next;

    });

  };



  const clearSlot = (index: number) => {

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
  };



  if (!ready && !catalog.length) {

    return <Loader />;

  }



  return (

    <div className="space-y-5">

      <Card className="constructor-seed-card">

        <div className="flex items-center gap-2 mb-3">

          <Wand2 className="constructor-wand w-5 h-5" />

          <h3 className="text-base font-semibold text-cr-text">4 карты — основа колоды</h3>

        </div>

        <p className="text-sm text-cr-text/85 mb-4 leading-relaxed">

          Ячейки 1 и 3 — эволюция (если доступна), ячейка 2 — героическая версия, ячейка 4 — обычная карта.

          Подбор по базе топовых колод — не случайный.

        </p>



        <div className="grid grid-cols-4 gap-2 sm:gap-3">

          {slots.map((pick, index) => {

            const card = pick ? catalog.find((c) => c.name === pick.name) ?? getCard(pick.name) : null;

            const isActive = activeSlot === index;

            return (

              <button

                key={index}

                type="button"

                onClick={() => setActiveSlot(index)}

                className={
                  "constructor-slot relative flex flex-col items-center rounded-xl border-2 p-1.5 transition-colors min-h-[5.5rem] " +
                  (isActive ? "constructor-slot--active" : "")
                }

              >

                <span className="text-3xs font-semibold text-cr-muted mb-1 uppercase tracking-wide">

                  {SLOT_HINTS[index]}

                </span>

                {card ? (

                  <>

                    <CardTile

                      name={card.name}

                      size="deck"

                      showLabel

                      {...slotCardProps(index, card as CatalogCard)}

                    />

                    <button

                      type="button"

                      onClick={(e) => {

                        e.stopPropagation();

                        clearSlot(index);

                      }}

                      className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-cr-bg border border-cr-border p-0.5 text-cr-muted"

                      aria-label="Убрать карту"

                    >

                      <X className="w-3 h-3" />

                    </button>

                  </>

                ) : (

                  <div className="flex flex-1 w-full items-center justify-center rounded-lg border border-dashed border-cr-border/50 text-2xs text-cr-muted px-1 text-center">

                    + карта

                  </div>

                )}

              </button>

            );

          })}

        </div>



        {filledCount > 0 ? (

          <Button variant="ghost" className="w-full mt-3 !py-2 text-sm" onClick={resetAll}>

            Сбросить выбор

          </Button>

        ) : null}

      </Card>



      {filledCount < 4 ? (

        <div>

          <div className="relative mb-3">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cr-muted" />

            <input

              type="search"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Поиск карты…"

              className="w-full rounded-3xl border border-cr-border/60 info-glass py-2.5 pl-10 pr-3 text-base text-cr-text placeholder:text-cr-muted focus:border-cr-gold/50 focus:outline-none"

            />

          </div>



          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[min(52vh,28rem)] overflow-y-auto pr-1">

            {filteredCards.map((card) => (

              <button

                key={card.name}

                type="button"

                onClick={() => placeCard(card)}

                className="rounded-lg p-1 transition-colors"

                title={nameRu(card.name)}

              >

                <CardTile

                  name={card.name}

                  icon={card.icon}

                  size="grid"

                  showLabel

                  elixirCost={card.elixir ?? undefined}

                />

              </button>

            ))}

          </div>

          {filteredCards.length === 0 ? <EmptyState title="Карты не найдены" /> : null}



          <Card className="text-center text-base text-cr-muted py-4 mt-3">

            Выберите ещё {4 - filledCount} {4 - filledCount === 1 ? "карту" : "карты"} — ниже появятся готовые колоды

          </Card>

        </div>

      ) : null}



      {loading ? <Loader /> : null}

      {error ? <ErrorState title={error} /> : null}

      {!loading && filledCount === 4 && decks.length > 0 ? (
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
          <h3 className="text-base font-semibold text-cr-text">
            Конфликт в ядре
          </h3>
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
            <h3 className="text-base font-semibold text-cr-text">
              Альтернативный вариант
            </h3>
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

  );

}



export function ConstructorDeckGrid({ cards }: { cards: DeckCard[] }) {
  const sorted = [...cards].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-3 mb-4">
      {sorted.map((card, i) => (
        <div key={`${card.id}-${i}`} className="min-w-0 overflow-visible">
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


