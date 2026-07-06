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
  idle: string;
  active: string;
}[] = [
  {
    key: "evolution_count",
    filter: "evolution",
    label: "Эволюции",
    tone: "collection-stat-evo",
    idle: "border-[#c084fc]/55 bg-[#c084fc]/14 shadow-[0_2px_8px_rgba(192,132,252,0.12)] hover:border-[#c084fc] hover:bg-[#c084fc]/22",
    active: "border-[#c084fc] bg-[#c084fc]/28 shadow-[0_0_14px_rgba(192,132,252,0.35)]",
  },
  {
    key: "hero_count",
    filter: "hero",
    label: "Герои",
    tone: "collection-stat-hero",
    idle: "border-[#84cc16]/55 bg-[#84cc16]/12 shadow-[0_2px_8px_rgba(132,204,22,0.12)] hover:border-[#a3e635] hover:bg-[#84cc16]/20",
    active: "border-[#a3e635] bg-[#84cc16]/26 shadow-[0_0_14px_rgba(163,230,53,0.35)]",
  },
  {
    key: "champion_count",
    filter: "champion",
    label: "Чемпионы",
    tone: "collection-stat-champion",
    idle: "border-[#fbbf24]/55 bg-[#fbbf24]/12 shadow-[0_2px_8px_rgba(251,191,36,0.12)] hover:border-[#fbbf24] hover:bg-[#fbbf24]/20",
    active: "border-[#fbbf24] bg-[#fbbf24]/26 shadow-[0_0_14px_rgba(251,191,36,0.35)]",
  },
  {
    key: "legendary_count",
    filter: "legendary",
    label: "Легендарные",
    tone: "collection-stat-legendary",
    idle: "border-[#f472b6]/55 bg-gradient-to-br from-[#f472b6]/12 to-[#a3e635]/10 shadow-[0_2px_8px_rgba(244,114,182,0.12)] hover:border-[#f472b6] hover:from-[#f472b6]/18 hover:to-[#a3e635]/14",
    active: "border-[#f472b6] bg-gradient-to-br from-[#f472b6]/24 to-[#a3e635]/18 shadow-[0_0_14px_rgba(244,114,182,0.3)]",
  },
  {
    key: "epic_count",
    filter: "epic",
    label: "Эпические",
    tone: "collection-stat-epic",
    idle: "border-[#f472b6]/55 bg-[#f472b6]/12 shadow-[0_2px_8px_rgba(244,114,182,0.12)] hover:border-[#f472b6] hover:bg-[#f472b6]/20",
    active: "border-[#f472b6] bg-[#f472b6]/26 shadow-[0_0_14px_rgba(244,114,182,0.35)]",
  },
  {
    key: "rare_count",
    filter: "rare",
    label: "Редкие",
    tone: "collection-stat-rare",
    idle: "border-[#fb923c]/55 bg-[#fb923c]/12 shadow-[0_2px_8px_rgba(251,146,60,0.12)] hover:border-[#fb923c] hover:bg-[#fb923c]/20",
    active: "border-[#fb923c] bg-[#fb923c]/26 shadow-[0_0_14px_rgba(251,146,60,0.35)]",
  },
  {
    key: "common_count",
    filter: "common",
    label: "Обычные",
    tone: "collection-stat-common",
    idle: "border-[#38bdf8]/55 bg-[#38bdf8]/12 shadow-[0_2px_8px_rgba(56,189,248,0.12)] hover:border-[#38bdf8] hover:bg-[#38bdf8]/20",
    active: "border-[#38bdf8] bg-[#38bdf8]/26 shadow-[0_0_14px_rgba(56,189,248,0.35)]",
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
        {STAT_ITEMS.map(({ key, filter, label, tone, idle, active }) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange?.(isActive ? "all" : filter)}
              className={
                "rounded-xl border-2 px-3 py-2.5 text-left transition-all cursor-pointer " +
                "active:scale-[0.97] " +
                (isActive ? active : idle)
              }
            >
              <p className={`text-[11px] font-bold uppercase tracking-wide ${tone}`}>{label}</p>
              <p className={`text-base font-extrabold tabular-nums mt-0.5 ${tone}`}>{stats[key]}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CollectionStatsGrid as default };
