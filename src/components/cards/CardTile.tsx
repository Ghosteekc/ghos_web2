import { cn } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";

type CardTileSize = "xs" | "sm" | "md" | "grid" | "lg";

const sizeClasses: Record<CardTileSize, string> = {
  xs: "w-9 h-11",
  sm: "w-11 h-[3.25rem] min-w-[2.75rem]",
  md: "w-14 h-16",
  grid: "w-14 h-[4.25rem] max-w-[4.5rem]",
  lg: "w-full max-w-[5rem] aspect-[4/5]",
};

interface CardTileProps {
  name: string;
  icon?: string;
  size?: CardTileSize;
  showLabel?: boolean;
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
  labelOverride,
  labelClassName,
  className,
  badge,
}: CardTileProps) {
  const { nameRu, iconUrl } = useCardCatalog();
  const src = icon || iconUrl(name);
  const label = labelOverride ?? nameRu(name);

  return (
    <div className={cn("flex flex-col items-center gap-1 min-w-0 shrink-0", className)}>
      <div
        className={cn(
          "relative rounded-lg overflow-hidden border border-cr-border/80 bg-cr-bg shadow-sm shrink-0",
          sizeClasses[size],
        )}
        title={label}
      >
        {src ? (
          <img
            src={src}
            alt={label}
            className="w-full h-full object-cover object-center scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cr-blue/30 to-cr-gold/20 text-xs font-bold text-cr-text">
            {name.charAt(0)}
          </div>
        )}
        {badge != null && (
          <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-cr-bg/90 text-cr-gold border border-cr-gold/30">
            {badge}
          </span>
        )}
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-[10px] leading-tight text-center line-clamp-2 max-w-full px-0.5",
            labelClassName ?? "text-cr-muted",
          )}
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
            "rounded-lg border border-cr-border bg-cr-surface flex items-center justify-center text-xs font-semibold text-cr-muted shrink-0",
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
  const { nameRu } = useCardCatalog();
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div
          key={item.name}
          className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-cr-bg/50 border border-cr-border"
        >
          <span className="absolute top-2 left-2 text-[10px] font-semibold text-cr-muted">
            #{i + 1}
          </span>
          <CardTile name={item.name} size="grid" className="mt-3" />
          <p className="card-name-glow text-xs text-center line-clamp-2 px-1">{nameRu(item.name)}</p>
          <p className="text-[10px] text-cr-muted">
            {item.count} игр
            {item.winrate != null ? ` · ${item.winrate.toFixed(0)}%` : ""}
          </p>
          <div className="w-full h-1 bg-cr-border rounded-full overflow-hidden">
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
