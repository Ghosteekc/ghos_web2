export type CollectionRarityFilter =
  | "all"
  | "evolution"
  | "hero"
  | "champion"
  | "legendary"
  | "epic"
  | "rare"
  | "common";

interface CollectionStatsGridProps {
  stats: {
    collection_level: number;
    evolution_count: number;
    hero_count: number;
    champion_count: number;
    legendary_count: number;
    epic_count: number;
    rare_count: number;
    common_count: number;
  };
  activeFilter?: CollectionRarityFilter;
  onFilterChange?: (filter: CollectionRarityFilter) => void;
}

const STAT_ITEMS: {
  key: keyof CollectionStatsGridProps["stats"];
  filter: CollectionRarityFilter;
  label: string;
  tone: string;
  activeClass: string;
}[] = [
  {
    key: "evolution_count",
    filter: "evolution",
    label: "Эволюции",
    tone: "collection-stat-evo",
    activeClass: "collection-filter-tab--evo",
  },
  {
    key: "hero_count",
    filter: "hero",
    label: "Герои",
    tone: "collection-stat-hero",
    activeClass: "collection-filter-tab--hero",
  },
  {
    key: "champion_count",
    filter: "champion",
    label: "Чемпионы",
    tone: "collection-stat-champion",
    activeClass: "collection-filter-tab--champion",
  },
  {
    key: "legendary_count",
    filter: "legendary",
    label: "Легендарные",
    tone: "collection-stat-legendary",
    activeClass: "collection-filter-tab--legendary",
  },
  {
    key: "epic_count",
    filter: "epic",
    label: "Эпические",
    tone: "collection-stat-epic",
    activeClass: "collection-filter-tab--epic",
  },
  {
    key: "rare_count",
    filter: "rare",
    label: "Редкие",
    tone: "collection-stat-rare",
    activeClass: "collection-filter-tab--rare",
  },
  {
    key: "common_count",
    filter: "common",
    label: "Обычные",
    tone: "collection-stat-common",
    activeClass: "collection-filter-tab--common",
  },
];

export function CollectionStatsGrid({
  stats,
  activeFilter = "all",
  onFilterChange,
}: CollectionStatsGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-cr-muted uppercase tracking-wide">Уровень коллекции</p>
        <p className="text-lg font-bold text-cr-gold tabular-nums">{stats.collection_level}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STAT_ITEMS.map(({ key, filter, label, tone, activeClass }) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange?.(isActive ? "all" : filter)}
              className={
                "collection-filter-tab filter-tab " +
                (isActive ? `filter-tab--active ${activeClass}` : "")
              }
            >
              <span className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${tone}`}>
                {label}
              </span>
              <span className={`text-base font-extrabold tabular-nums leading-none mt-1 ${tone}`}>
                {stats[key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CollectionStatsGrid as default };
