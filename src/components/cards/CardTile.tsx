import { cn } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";

type CardTileSize = "xs" | "sm" | "md" | "grid" | "lg" | "deck";

const sizeClasses: Record<CardTileSize, string> = {
  xs: "w-9 h-11",
  sm: "w-11 h-[3.25rem] min-w-[2.75rem]",
  md: "w-14 h-16",
  grid: "w-14 h-[4.25rem] max-w-[4.5rem]",
  lg: "w-full max-w-[5rem] aspect-[4/5]",
  deck: "w-full max-w-[3rem] aspect-[4/5] mx-auto",
};

const labelSizeClasses: Record<CardTileSize, string> = {
  xs: "max-w-[2.25rem] text-[7px]",
  sm: "max-w-[2.75rem] text-[7px]",
  md: "max-w-[3.5rem] text-[8px]",
  grid: "max-w-[3.5rem] text-[8px]",
  lg: "max-w-[4rem] text-[8px]",
  deck: "card-name-deck",
};

interface CardTileProps {
  name: string;
  icon?: string;
  size?: CardTileSize;
  showLabel?: boolean;
  compactLabel?: boolean;
  labelOverride?: string;
  labelClassName?: string;
  className?: string;
  badge?: string | number;
}

export function CardTile({
  name,
  icon,
  size = "md",
  showLabel = false,
  compactLabel = true,
  labelOverride,
  labelClassName,
  className,
  badge,
}: CardTileProps) {
  const { nameRu, nameShort, iconUrl } = useCardCatalog();
  const src = icon || iconUrl(name);
  const label =
    labelOverride ??
    ((compactLabel || size === "deck") && showLabel ? nameShort(name) : nameRu(name));

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 min-w-0",
        size === "deck" && "w-full overflow-hidden",
        className,
      )}
    >
      <div className={cn("relative shrink-0 card-tile-wrap", sizeClasses[size])} title={nameRu(name)}>
        <div className="card-tile-glow" aria-hidden />
        {src ? (
          <img
            src={src}
            alt={nameRu(name)}
            className="relative z-10 w-full h-full object-contain object-center drop-shadow-md"
            loading="lazy"
          />
        ) : (
          <div className="relative z-10 w-full h-full flex items-center justify-center text-xs font-bold text-cr-text">
            {name.charAt(0)}
          </div>
        )}
        {showLabel && size === "deck" && (
          <span className="card-name-deck-overlay" title={nameRu(name)}>
            {label}
          </span>
        )}
        {badge != null && (
          <span className="absolute bottom-0.5 right-0.5 z-20 px-1 py-0.5 rounded text-[10px] font-bold bg-cr-bg/90 text-cr-gold border border-cr-gold/30">
            {badge}
          </span>
        )}
      </div>
      {showLabel && size !== "deck" && (
        <span
          className={cn(
            "card-name-glow leading-none text-center truncate px-0.5 font-extrabold",
            labelSizeClasses[size],
            labelClassName,
          )}
          title={nameRu(name)}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface CardDeckGridProps {
  cards: string[];
  icons?: string[];
  size?: CardTileSize;
  showLabels?: boolean;
  maxVisible?: number;
  className?: string;
}

export function CardDeckGrid({
  cards,
  icons,
  size = "sm",
  showLabels = false,
  maxVisible = 8,
  className,
}: CardDeckGridProps) {
  const visible = cards.slice(0, maxVisible);
  const hidden = cards.length - visible.length;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((name, i) => (
        <CardTile
          key={`${name}-${i}`}
          name={name}
          icon={icons?.[i]}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {hidden > 0 && (
        <div
          className={cn(
            "flex items-center justify-center text-xs font-semibold text-cr-muted shrink-0",
            sizeClasses[size],
          )}
        >
          +{hidden}
        </div>
      )}
    </div>
  );
}

interface CardUsageItem {
  name: string;
  count: number;
  winrate?: number;
}

export function CardUsageList({ items }: { items: CardUsageItem[] }) {
  return <CardUsageCompactGrid items={items} />;
}

export function CardUsageCompactGrid({ items }: { items: CardUsageItem[] }) {
  const { nameRu, nameShort } = useCardCatalog();
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.name} className="flex flex-col items-center gap-1.5 py-1">
          <CardTile name={item.name} size="grid" />
          <p className="card-name-glow text-xs text-center truncate max-w-[5rem] px-0.5" title={nameRu(item.name)}>
            {nameShort(item.name)}
          </p>
          <p className="text-[10px] text-cr-accent font-semibold">
            {item.count} игр
            {item.winrate != null ? ` · ${item.winrate.toFixed(0)}%` : ""}
          </p>
          <div className="w-full h-1 bg-cr-border/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cr-blue to-cr-gold"
              style={{ width: `${Math.min((item.count / maxCount) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated use CardUsageCompactGrid */
export function CardUsageGrid({ items }: { items: CardUsageItem[] }) {
  return <CardUsageCompactGrid items={items} />;
}

function CardNameRu({ name }: { name: string }) {
  const { nameRu } = useCardCatalog();
  return <>{nameRu(name)}</>;
}

export { CardNameRu };
