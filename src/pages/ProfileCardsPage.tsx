import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { CollectionStatsGrid, type CollectionRarityFilter } from "@/components/profile/CollectionStatsGrid";
import { usePlayerCollection } from "@/hooks/usePlayerCollection";
import { usePageRefresh, useCardCatalog } from "@/hooks";
import type { CollectionCardEntry } from "@/types";

type SortMode = "rarity" | "level" | "elixir";
type SortDirection = "asc" | "desc";

const RARITY_ORDER: Record<string, number> = {
  champion: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

const SORT_OPTIONS: { id: SortMode; label: string; defaultDir: SortDirection }[] = [
  { id: "rarity", label: "Редкость", defaultDir: "desc" },
  { id: "level", label: "Уровень", defaultDir: "desc" },
  { id: "elixir", label: "Эликсир", defaultDir: "asc" },
];

function withDirection(cmp: number, dir: SortDirection): number {
  return dir === "asc" ? cmp : -cmp;
}

function tieBreak(a: CollectionCardEntry, b: CollectionCardEntry): number {
  return a.name_ru.localeCompare(b.name_ru, "ru");
}

function sortCards(
  cards: CollectionCardEntry[],
  mode: SortMode,
  direction: SortDirection,
  resolveElixir: (card: CollectionCardEntry) => number,
): CollectionCardEntry[] {
  const list = [...cards];

  switch (mode) {
    case "level":
      return list.sort((a, b) => {
        const cmp = withDirection((a.level ?? -1) - (b.level ?? -1), direction);
        return cmp !== 0 ? cmp : tieBreak(a, b);
      });
    case "elixir":
      return list.sort((a, b) => {
        const cmp = withDirection(resolveElixir(a) - resolveElixir(b), direction);
        return cmp !== 0 ? cmp : tieBreak(a, b);
      });
    case "rarity":
      return list.sort((a, b) => {
        const rarityCmp = (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99);
        const cmp = withDirection(rarityCmp, direction);
        if (cmp !== 0) return cmp;
        const levelCmp = withDirection((a.level ?? -1) - (b.level ?? -1), "desc");
        return levelCmp !== 0 ? levelCmp : tieBreak(a, b);
      });
    default:
      return list;
  }
}

function defaultDirection(mode: SortMode): SortDirection {
  return SORT_OPTIONS.find((o) => o.id === mode)?.defaultDir ?? "asc";
}

function matchesRarityFilter(
  card: CollectionCardEntry,
  filter: CollectionRarityFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "evolution") {
    return (
      card.has_evolution_unlocked ??
      (card.evolution_level === 1 || card.evolution_level >= 3)
    );
  }
  if (filter === "hero") {
    return card.has_hero_unlocked ?? card.evolution_level >= 2;
  }
  return card.rarity === filter;
}

const FILTER_LABELS: Record<CollectionRarityFilter, string> = {
  all: "Все",
  evolution: "Эволюции",
  hero: "Герои",
  champion: "Чемпионы",
  legendary: "Легендарные",
  epic: "Эпические",
  rare: "Редкие",
  common: "Обычные",
};

export function ProfileCardsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = usePlayerCollection();
  const { getCard } = useCardCatalog();
  const [showLockedCards, setShowLockedCards] = useState(true);
  const [rarityFilter, setRarityFilter] = useState<CollectionRarityFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("rarity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  usePageRefresh(reload);

  const resolveElixir = useCallback(
    (card: CollectionCardEntry) => card.elixir ?? getCard(card.name)?.elixir ?? 99,
    [getCard],
  );

  const visibleCards = useMemo(() => {
    if (!data) return [];
    const base = showLockedCards ? data.cards : data.cards.filter((c) => c.owned);
    const filtered =
      rarityFilter === "all"
        ? base
        : base.filter((c) => matchesRarityFilter(c, rarityFilter));
    return sortCards(filtered, sortMode, sortDirection, resolveElixir);
  }, [data, showLockedCards, rarityFilter, sortMode, sortDirection, resolveElixir]);

  const handleSortMode = (mode: SortMode) => {
    if (mode === sortMode) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortMode(mode);
    setSortDirection(defaultDirection(mode));
  };

  const toggleDirection = () => {
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  };

  if (loading) return <Loader />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Коллекция карт" onBack={() => navigate("/")} />
        <Card className="text-center space-y-3">
          <p className="text-cr-loss text-sm">{error ?? "Нет данных"}</p>
          <Button onClick={() => void reload()}>Повторить</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Коллекция карт" onBack={() => navigate("/")} />

      <Card>
        <CollectionStatsGrid
          stats={data}
          activeFilter={rarityFilter}
          onFilterChange={setRarityFilter}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mt-5 mb-3 pt-4 border-t border-cr-border">
          <p className="text-sm text-cr-text font-semibold">
            {rarityFilter !== "all"
              ? `${visibleCards.length} карт · ${FILTER_LABELS[rarityFilter]}`
              : `${data.cards_owned} / ${data.cards_total} карт`}
          </p>
          <div className="flex items-center gap-3">
            {rarityFilter !== "all" && (
              <button
                type="button"
                className="pixel-btn pixel-btn--text underline"
                onClick={() => setRarityFilter("all")}
              >
                Сбросить фильтр
              </button>
            )}
            <button
              type="button"
              className="text-xs text-cr-accent underline"
              onClick={() => setShowLockedCards((v) => !v)}
            >
              {showLockedCards ? "Только мои" : "Показать все"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {SORT_OPTIONS.map((opt) => {
            const active = sortMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSortMode(opt.id)}
                className={
                  "pixel-btn pixel-btn--chip-sm " +
                  (active ? "pixel-btn--active text-cr-gold" : "text-cr-muted")
                }
              >
                {opt.label}
                {active ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="w-3 h-3" aria-hidden />
                  ) : (
                    <ArrowDown className="w-3 h-3" aria-hidden />
                  )
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            onClick={toggleDirection}
            title={sortDirection === "asc" ? "По возрастанию" : "По убыванию"}
            className="pixel-btn pixel-btn--chip-sm text-cr-muted"
          >
            {sortDirection === "asc" ? (
              <>
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Возр.</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Убыв.</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {visibleCards.length === 0 ? (
            <p className="col-span-full text-center text-sm text-cr-muted py-6">
              Нет карт для фильтра «{FILTER_LABELS[rarityFilter]}»
            </p>
          ) : (
            visibleCards.map((card) => {
              const elixir = resolveElixir(card);
              return (
                <div
                  key={card.name}
                  className={cnCardCell(card.owned)}
                  title={card.name_ru}
                >
                  <CardTile
                    name={card.name}
                    icon={card.icon}
                    iconBase={card.icon_base}
                    iconEvo={card.icon_evo}
                    iconHero={card.icon_hero}
                    displayMode={card.display_mode}
                    rarity={card.rarity}
                    size="collection"
                    levelBadge={card.owned && card.level != null && card.level > 0 ? card.level : undefined}
                    elixirCost={elixir < 99 ? elixir : undefined}
                  />
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function cnCardCell(owned: boolean) {
  return owned ? "min-w-0" : "min-w-0 opacity-45 grayscale";
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" onClick={onBack} className="!p-2 shrink-0">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="page-title !mb-0">{title}</h1>
    </div>
  );
}

export { ProfileCardsPage as default };
