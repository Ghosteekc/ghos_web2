import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { usePlayerCollection } from "@/hooks/usePlayerCollection";
import { usePageRefresh } from "@/hooks";
import type { CollectionCardEntry } from "@/types";

type SortMode = "default" | "rarity" | "level" | "elixir";
type SortDirection = "asc" | "desc";

const RARITY_ORDER: Record<string, number> = {
  champion: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

const SORT_OPTIONS: { id: SortMode; label: string; defaultDir: SortDirection }[] = [
  { id: "default", label: "По имени", defaultDir: "asc" },
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
        const cmp = withDirection((a.elixir ?? 99) - (b.elixir ?? 99), direction);
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
      return list.sort((a, b) => withDirection(tieBreak(a, b), direction));
  }
}

function defaultDirection(mode: SortMode): SortDirection {
  return SORT_OPTIONS.find((o) => o.id === mode)?.defaultDir ?? "asc";
}

export function ProfileCardsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = usePlayerCollection();
  const [showLockedCards, setShowLockedCards] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  usePageRefresh(reload);

  const visibleCards = useMemo(() => {
    if (!data) return [];
    const base = showLockedCards ? data.cards : data.cards.filter((c) => c.owned);
    return sortCards(base, sortMode, sortDirection);
  }, [data, showLockedCards, sortMode, sortDirection]);

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
        <PageHeader title="Коллекция карт" onBack={() => navigate("/profile")} />
        <Card className="text-center space-y-3">
          <p className="text-cr-loss text-sm">{error ?? "Нет данных"}</p>
          <Button onClick={() => void reload()}>Повторить</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Коллекция карт" onBack={() => navigate("/profile")} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm text-cr-text font-semibold">
            {data.cards_owned} / {data.cards_total} карт
          </p>
          <button
            type="button"
            className="text-xs text-cr-accent underline"
            onClick={() => setShowLockedCards((v) => !v)}
          >
            {showLockedCards ? "Только мои" : "Показать все"}
          </button>
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
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors " +
                  (active
                    ? "border-cr-gold/50 bg-cr-gold/15 text-cr-gold"
                    : "border-cr-border/40 text-cr-muted hover:text-cr-text")
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
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-cr-border/40 text-cr-muted hover:text-cr-text"
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
          {visibleCards.map((card) => (
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
                size="collection"
                levelBadge={card.owned && card.level != null && card.level > 0 ? card.level : undefined}
              />
            </div>
          ))}
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
