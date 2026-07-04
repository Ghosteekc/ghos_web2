import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { usePlayerCollection } from "@/hooks/usePlayerCollection";
import { usePageRefresh } from "@/hooks";
import type { CollectionCardEntry } from "@/types";

type SortMode = "default" | "rarity" | "level" | "elixir";

const RARITY_ORDER: Record<string, number> = {
  champion: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "default", label: "По имени" },
  { id: "rarity", label: "Редкость" },
  { id: "level", label: "Уровень" },
  { id: "elixir", label: "Эликсир" },
];

function sortCards(cards: CollectionCardEntry[], mode: SortMode): CollectionCardEntry[] {
  const list = [...cards];
  switch (mode) {
    case "level":
      return list.sort((a, b) => {
        const dl = (b.level ?? -1) - (a.level ?? -1);
        return dl !== 0 ? dl : a.name_ru.localeCompare(b.name_ru, "ru");
      });
    case "elixir":
      return list.sort((a, b) => {
        const de = (a.elixir ?? 99) - (b.elixir ?? 99);
        return de !== 0 ? de : a.name_ru.localeCompare(b.name_ru, "ru");
      });
    case "rarity":
      return list.sort((a, b) => {
        const dr =
          (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99);
        if (dr !== 0) return dr;
        const dl = (b.level ?? -1) - (a.level ?? -1);
        return dl !== 0 ? dl : a.name_ru.localeCompare(b.name_ru, "ru");
      });
    default:
      return list.sort((a, b) => a.name_ru.localeCompare(b.name_ru, "ru"));
  }
}

export function ProfileCardsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = usePlayerCollection();
  const [showLockedCards, setShowLockedCards] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("default");

  usePageRefresh(reload);

  const visibleCards = useMemo(() => {
    if (!data) return [];
    const base = showLockedCards ? data.cards : data.cards.filter((c) => c.owned);
    return sortCards(base, sortMode);
  }, [data, showLockedCards, sortMode]);

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

        <div className="flex flex-wrap gap-1.5 mb-4">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortMode(opt.id)}
              className={
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors " +
                (sortMode === opt.id
                  ? "border-cr-gold/50 bg-cr-gold/15 text-cr-gold"
                  : "border-cr-border/40 text-cr-muted hover:text-cr-text")
              }
            >
              {opt.label}
            </button>
          ))}
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
