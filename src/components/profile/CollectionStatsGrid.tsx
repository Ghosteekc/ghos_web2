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
  activeRing: string;
}[] = [
  {
    key: "evolution_count",
    filter: "evolution",
    label: "Эволюции",
    tone: "collection-stat-evo",
    activeRing: "ring-[#c084fc]/70 bg-[#c084fc]/10",
  },
  {
    key: "hero_count",
    filter: "hero",
    label: "Герои",
    tone: "collection-stat-hero",
    activeRing: "ring-[#a3e635]/70 bg-[#a3e635]/10",
  },
  {
    key: "champion_count",
    filter: "champion",
    label: "Чемпионы",
    tone: "collection-stat-champion",
    activeRing: "ring-[#fbbf24]/70 bg-[#fbbf24]/10",
  },
  {
    key: "legendary_count",
    filter: "legendary",
    label: "Легендарные",
    tone: "collection-stat-legendary",
    activeRing: "ring-[#f472b6]/70 bg-[#f472b6]/10",
  },
  {
    key: "epic_count",
    filter: "epic",
    label: "Эпические",
    tone: "collection-stat-epic",
    activeRing: "ring-[#f472b6]/70 bg-[#f472b6]/10",
  },
  {
    key: "rare_count",
    filter: "rare",
    label: "Редкие",
    tone: "collection-stat-rare",
    activeRing: "ring-[#fb923c]/70 bg-[#fb923c]/10",
  },
  {
    key: "common_count",
    filter: "common",
    label: "Обычные",
    tone: "collection-stat-common",
    activeRing: "ring-[#38bdf8]/70 bg-[#38bdf8]/10",
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
        {STAT_ITEMS.map(({ key, filter, label, tone, activeRing }) => {
          const active = activeFilter === filter;
          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                onFilterChange?.(active ? "all" : filter)
              }
              className={
                "rounded-xl px-3 py-2 text-left transition-all border border-transparent " +
                (active
                  ? `ring-1 ${activeRing}`
                  : "bg-cr-bg/50 hover:bg-cr-bg/70 active:scale-[0.98]")
              }
            >
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${tone}`}>
                {label}
              </p>
              <p className={`text-sm font-bold tabular-nums mt-0.5 ${tone}`}>{stats[key]}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CollectionStatsGrid as default };
