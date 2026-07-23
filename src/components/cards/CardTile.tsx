import { cn } from "@/utils";
import { useState } from "react";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { ElixirIcon } from "@/components/ui/ElixirIcon";
import type { CardDisplayMode } from "@/types";

type CardTileSize = "xs" | "sm" | "md" | "grid" | "lg" | "deck" | "collection";

const sizeClasses: Record<CardTileSize, string> = {
  xs: "w-9 h-11",
  sm: "w-11 h-[3.25rem] min-w-[2.75rem]",
  md: "w-14 h-16",
  grid: "w-14 h-[4.25rem] max-w-[4.5rem]",
  lg: "w-full max-w-[4.25rem] aspect-[4/5] mx-auto",
  deck: "w-full max-w-[3rem] aspect-[4/5] mx-auto",
  collection: "w-full max-w-[4.75rem] aspect-[4/5] mx-auto",
};

const labelSizeClasses: Record<CardTileSize, string> = {
  xs: "max-w-[2.25rem] text-[7px]",
  sm: "max-w-[2.75rem] text-[7px]",
  md: "max-w-[3.5rem] text-[8px]",
  grid: "max-w-[3.5rem] text-[8px]",
  lg: "max-w-[4rem] text-[8px]",
  deck: "card-name-deck",
  collection: "card-name-deck",
};

function cardFrameClass(displayMode: CardDisplayMode, rarity?: string): string {
  if (rarity === "champion") return "card-frame-champion";
  switch (displayMode) {
    case "evo":
      return "card-frame-evo";
    case "hero":
      return "card-frame-hero";
    case "split":
      return "card-frame-split";
    default:
      return "card-frame-base";
  }
}

function CardArt({
  name,
  src,
  iconBase,
  iconEvo,
  iconHero,
  displayMode = "base",
  fallbackSrc,
}: {
  name: string;
  src: string;
  iconBase?: string;
  iconEvo?: string;
  iconHero?: string;
  displayMode?: CardDisplayMode;
  fallbackSrc?: string;
}) {
  const base = iconBase || src;
  const evo = iconEvo || base;
  const hero = iconHero || base;
  const [broken, setBroken] = useState(false);

  const pick = (url: string) => (broken && fallbackSrc ? fallbackSrc : url);

  if (displayMode === "split" && evo && hero) {
    return (
      <div className="relative z-10 h-full w-full">
        <img
          src={pick(evo)}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain object-center drop-shadow-md [clip-path:inset(0_50%_0_0)]"
          loading="lazy"
          onError={() => setBroken(true)}
        />
        <img
          src={pick(hero)}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain object-center drop-shadow-md [clip-path:inset(0_0_0_50%)]"
          loading="lazy"
          onError={() => setBroken(true)}
        />
        <div className="absolute inset-y-[8%] left-1/2 z-20 w-px -translate-x-1/2 bg-black/50" aria-hidden />
      </div>
    );
  }

  const active =
    displayMode === "evo" ? evo : displayMode === "hero" ? hero : base;

  return (
    <img
      src={pick(active)}
      alt={name}
      className="relative z-10 h-full w-full object-contain object-center drop-shadow-md"
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

function ElixirCostBadge({ cost }: { cost: number }) {
  return (
    <span className="cr-elixir-badge" aria-label={`${cost} эликсира`}>
      <ElixirIcon size={20} className="text-[#d946ef]" />
      <span className="cr-elixir-badge-num">{cost}</span>
    </span>
  );
}

function LevelBadge({ level }: { level: string | number }) {
  return (
    <span className="cr-level-badge" aria-label={`Уровень ${level}`}>
      {level}
    </span>
  );
}

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
  levelBadge?: string | number;
  elixirCost?: number;
  rarity?: string;
  displayMode?: CardDisplayMode;
  iconBase?: string;
  iconEvo?: string;
  iconHero?: string;
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
  levelBadge,
  elixirCost,
  rarity,
  displayMode = "base",
  iconBase,
  iconEvo,
  iconHero,
}: CardTileProps) {
  const { nameRu, nameShort, iconUrl } = useCardCatalog();
  const src = icon || iconUrl(name);
  const fallbackSrc =
    name.trim().toLowerCase() === "ronin" ? "/cards/ronin.png" : iconUrl(name) || undefined;
  const isCollection = size === "collection";
  const overlayLabel = showLabel && (size === "deck" || size === "lg");
  const label =
    labelOverride ??
    ((compactLabel || size === "deck" || size === "lg") && showLabel ? nameShort(name) : nameRu(name));

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 min-w-0",
        size === "deck" && "w-full overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 card-tile-wrap",
          isCollection ? "overflow-visible collection-card-wrap" : "overflow-hidden",
          sizeClasses[size],
        )}
        title={nameRu(name)}
      >
        {!isCollection && <div className="card-tile-glow" aria-hidden />}
        <div
          className={cn(
            "relative h-full w-full",
            isCollection && cardFrameClass(displayMode, rarity),
          )}
        >
          {src ? (
            <CardArt
              name={nameRu(name)}
              src={src}
              iconBase={iconBase ?? src}
              iconEvo={iconEvo}
              iconHero={iconHero}
              displayMode={displayMode}
              fallbackSrc={fallbackSrc}
            />
          ) : (
            <div className="relative z-10 flex h-full w-full items-center justify-center text-xs font-bold text-cr-text">
              {name.charAt(0)}
            </div>
          )}
        </div>
        {overlayLabel && (
          <span
            className={cn("card-name-deck-overlay", size === "lg" && "card-name-lg-overlay")}
            title={nameRu(name)}
          >
            {label}
          </span>
        )}
        {isCollection && levelBadge != null && <LevelBadge level={levelBadge} />}
        {isCollection && elixirCost != null && <ElixirCostBadge cost={elixirCost} />}
        {!isCollection && levelBadge != null && (
          <span className="absolute top-0 right-0 z-50 min-w-[1.1rem] rounded-md border border-cr-gold/40 bg-cr-bg/95 px-1 py-0.5 text-[10px] font-sans font-extrabold leading-none text-white pointer-events-none">
            {levelBadge}
          </span>
        )}
        {badge != null && (
          <span className="absolute bottom-0.5 right-0.5 z-20 rounded border border-cr-gold/30 bg-cr-bg/90 px-1 py-0.5 text-[10px] font-bold text-cr-gold">
            {badge}
          </span>
        )}
      </div>
      {showLabel && !overlayLabel && (
        <span
          className={cn(
            "card-name-glow truncate px-0.5 text-center font-extrabold leading-none",
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
  const limit = Math.min(Math.max(maxVisible, 1), 8);
  const visible = cards.slice(0, limit);
  const hidden = cards.length - visible.length;
  const slots = Array.from({ length: 8 }, (_, index) => visible[index] ?? null);

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-1 w-full">
        {slots.map((name, index) => (
          <div key={name ? `${name}-${index}` : `empty-${index}`} className="min-w-0 overflow-hidden">
            {name ? (
              <CardTile
                name={name}
                icon={icons?.[index]}
                size={size}
                showLabel={showLabels}
              />
            ) : null}
          </div>
        ))}
      </div>
      {hidden > 0 ? (
        <p className="mt-1 text-center text-xs font-semibold text-cr-muted">+{hidden}</p>
      ) : null}
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

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.name} className="flex flex-col items-center gap-1.5 py-1">
          <CardTile name={item.name} size="grid" />
          <p className="card-name-glow max-w-[5rem] truncate px-0.5 text-center text-xs" title={nameRu(item.name)}>
            {nameShort(item.name)}
          </p>
          <p className="text-[10px] font-semibold text-cr-accent">
            {item.count} игр
            {item.winrate != null ? ` · ${item.winrate.toFixed(0)}% WR` : ""}
          </p>
          {item.winrate != null ? (
            <div className="h-1 w-full overflow-hidden rounded-full bg-cr-border/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cr-blue to-cr-gold"
                style={{ width: `${Math.min(item.winrate, 100)}%` }}
                title={`Винрейт с картой: ${item.winrate.toFixed(0)}%`}
              />
            </div>
          ) : null}
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
