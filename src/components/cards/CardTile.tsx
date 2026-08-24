import { memo, useState } from "react";
import { cn } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { ElixirIcon } from "@/components/ui/ElixirIcon";
import type { CardDisplayMode } from "@/types";
import { cardUpgradeRimClass, cardUpgradeWrapClass } from "./cardDisplayMode";

type CardTileSize = "xs" | "sm" | "md" | "grid" | "lg" | "deck" | "collection";

const sizeClasses: Record<CardTileSize, string> = {
  xs: "w-9 h-11",
  sm: "w-11 h-[3.25rem] min-w-[2.75rem]",
  md: "w-14 h-16",
  grid: "w-14 h-[4.25rem] max-w-[4.5rem]",
  lg: "w-full max-w-[4.25rem] aspect-[4/5] mx-auto",
  deck: "w-full max-w-[3.45rem] aspect-[4/5] mx-auto",
  collection: "w-full max-w-[4.75rem] aspect-[4/5] mx-auto",
};

const labelSizeClasses: Record<CardTileSize, string> = {
  xs: "max-w-[2.25rem] text-3xs",
  sm: "max-w-[2.75rem] text-3xs",
  md: "max-w-[3.5rem] text-3xs",
  grid: "max-w-[3.5rem] text-3xs",
  lg: "max-w-[4rem] text-3xs",
  deck: "card-name-deck",
  collection: "card-name-deck",
};

function cardFrameClass(displayMode: CardDisplayMode, rarity?: string): string | null {
  if (rarity === "champion") return "card-frame-champion";
  switch (displayMode) {
    case "evo":
      return "card-frame-evo";
    case "hero":
      return "card-frame-hero";
    case "split":
      return "card-frame-split";
    default:
      return null;
  }
}

function collectionFrameClass(displayMode: CardDisplayMode, rarity?: string): string {
  return cardFrameClass(displayMode, rarity) ?? "card-frame-base";
}

function isLocalCardArt(url?: string): boolean {
  if (!url) return false;
  return url.startsWith("/cards/") || url.includes("/cards/");
}

function needsUpgradeOverlay(
  displayMode: CardDisplayMode,
  evoUrl: string,
  heroUrl: string,
): boolean {
  if (displayMode === "base") return false;
  // Official CDN portraits already bake evo/hero diamonds into the PNG.
  // Local season arts (and identical split sides) need an explicit overlay.
  if (displayMode === "split") {
    return isLocalCardArt(evoUrl) || isLocalCardArt(heroUrl) || evoUrl === heroUrl;
  }
  if (displayMode === "hero") return isLocalCardArt(heroUrl);
  if (displayMode === "evo") return isLocalCardArt(evoUrl);
  return false;
}

function CardUpgradeBadges({ displayMode }: { displayMode: CardDisplayMode }) {
  if (displayMode !== "evo" && displayMode !== "hero" && displayMode !== "split") {
    return null;
  }
  return (
    <div className="card-upgrade-badges" aria-hidden>
      {(displayMode === "evo" || displayMode === "split") && (
        <span className="card-upgrade-badge card-upgrade-badge--evo" title="Эволюция" />
      )}
      {(displayMode === "hero" || displayMode === "split") && (
        <span className="card-upgrade-badge card-upgrade-badge--hero" title="Героизм" />
      )}
    </div>
  );
}

function CardArt({
  name,
  src,
  iconBase,
  iconEvo,
  iconHero,
  displayMode = "base",
  fallbackBase,
  fallbackEvo,
  fallbackHero,
}: {
  name: string;
  src: string;
  iconBase?: string;
  iconEvo?: string;
  iconHero?: string;
  displayMode?: CardDisplayMode;
  fallbackBase?: string;
  fallbackEvo?: string;
  fallbackHero?: string;
}) {
  const base = iconBase || src;
  const evo = iconEvo || base;
  const hero = iconHero || base;
  const [brokenBase, setBrokenBase] = useState(false);
  const [brokenEvo, setBrokenEvo] = useState(false);
  const [brokenHero, setBrokenHero] = useState(false);
  const showBadges = needsUpgradeOverlay(displayMode, evo, hero);

  const pick = (url: string, broken: boolean, fallback?: string) =>
    broken && fallback ? fallback : url;

  if (displayMode === "split" && evo && hero) {
    return (
      <div className="relative z-10 h-full w-full">
        <img
          src={pick(evo, brokenEvo, fallbackEvo || fallbackBase)}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain object-center [clip-path:inset(0_50%_0_0)]"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setBrokenEvo(true)}
        />
        <img
          src={pick(hero, brokenHero, fallbackHero || fallbackBase)}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain object-center [clip-path:inset(0_0_0_50%)]"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setBrokenHero(true)}
        />
        <div className="absolute inset-y-[8%] left-1/2 z-20 w-px -translate-x-1/2 bg-black/55" aria-hidden />
        {showBadges && <CardUpgradeBadges displayMode="split" />}
      </div>
    );
  }

  const active =
    displayMode === "evo" ? evo : displayMode === "hero" ? hero : base;
  const activeBroken =
    displayMode === "evo" ? brokenEvo : displayMode === "hero" ? brokenHero : brokenBase;
  const activeFallback =
    displayMode === "evo"
      ? fallbackEvo || fallbackBase
      : displayMode === "hero"
        ? fallbackHero || fallbackBase
        : fallbackBase;
  const setActiveBroken =
    displayMode === "evo" ? setBrokenEvo : displayMode === "hero" ? setBrokenHero : setBrokenBase;

  return (
    <div className="relative z-10 h-full w-full">
      <img
        src={pick(active, activeBroken, activeFallback)}
        alt={name}
        className="relative z-10 h-full w-full object-contain object-center"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setActiveBroken(true)}
      />
      {showBadges && <CardUpgradeBadges displayMode={displayMode} />}
    </div>
  );
}

function ElixirCostBadge({ cost, size = "md" }: { cost: number; size?: "md" | "lg" }) {
  const iconSize = size === "lg" ? 26 : 22;
  return (
    <span className={cn("cr-elixir-badge", size === "lg" && "cr-elixir-badge--lg")} aria-label={`${cost} эликсира`}>
      <ElixirIcon size={iconSize} className="text-[#d946ef]" />
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
  /** Small-tile level chip corner (default top-right). Use top-left in tight grids. */
  levelBadgeAnchor?: "top-left" | "top-right";
  elixirCost?: number;
  rarity?: string;
  displayMode?: CardDisplayMode;
  iconBase?: string;
  iconEvo?: string;
  iconHero?: string;
}

export function CardTile(props: CardTileProps) {
  return <CardTileImpl {...props} />;
}

const CardTileImpl = memo(function CardTileImpl({
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
  levelBadgeAnchor = "top-right",
  elixirCost,
  rarity,
  displayMode = "base",
  iconBase,
  iconEvo,
  iconHero,
}: CardTileProps) {
  const { nameRu, nameShort, iconUrl, getCard } = useCardCatalog();
  const catalog = getCard(name);
  const src = icon || iconUrl(name);
  const key = name.trim().toLowerCase();
  const resolvedIconBase = iconBase || catalog?.icon || src;
  const resolvedIconEvo =
    iconEvo ||
    catalog?.icon_evo ||
    (key === "elite barbarians" ? "/cards/elite-barbarians-ev1.png" : undefined);
  const resolvedIconHero =
    iconHero ||
    catalog?.icon_hero ||
    (key === "valkyrie"
      ? "/cards/valkyrie-hero.png"
      : key === "berserker"
        ? "/cards/berserker-hero.png"
        : undefined);
  const fallbackBase = iconUrl(name) || resolvedIconBase || undefined;
  const fallbackEvo =
    key === "elite barbarians"
      ? "/cards/elite-barbarians-ev1.png"
      : catalog?.icon_evo || fallbackBase;
  const fallbackHero =
    key === "valkyrie"
      ? "/cards/valkyrie-hero.png"
      : key === "berserker"
        ? "/cards/berserker-hero.png"
        : catalog?.icon_hero || fallbackBase;
  const isCollection = size === "collection";
  const catalogElixir = catalog?.elixir;
  const resolvedElixir =
    elixirCost != null && elixirCost > 0 && elixirCost < 99
      ? elixirCost
      : catalogElixir != null && catalogElixir > 0 && catalogElixir < 99
        ? catalogElixir
        : null;
  const showElixir =
    resolvedElixir != null && (isCollection || size === "deck" || size === "lg" || size === "grid");
  // Keep name captions under the art so they never cover the card frame.
  const overlayLabel = false;
  const label =
    labelOverride ??
    ((compactLabel || size === "deck" || size === "lg") && showLabel ? nameShort(name) : nameRu(name));
  const belowCaption = showLabel && (size === "deck" || size === "lg");
  const upgradeWrap = cardUpgradeWrapClass(displayMode, rarity);
  const upgradeRim = cardUpgradeRimClass(displayMode, rarity);
  const innerFrameClass = isCollection
    ? collectionFrameClass(displayMode, rarity)
    : cardFrameClass(displayMode, rarity);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 min-w-0 w-full",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 card-tile-wrap",
          upgradeWrap,
          isCollection
            ? "overflow-visible collection-card-wrap"
            : showElixir || levelBadge != null
              ? "overflow-visible"
              : "overflow-hidden",
          sizeClasses[size],
        )}
        title={nameRu(name)}
      >
        {!isCollection && (
          <span className={cn("card-tile-rim", upgradeRim)} aria-hidden />
        )}
        <div className={cn("relative z-10 h-full w-full", innerFrameClass)}>
          {src ? (
            <CardArt
              name={nameRu(name)}
              src={src}
              iconBase={resolvedIconBase || src}
              iconEvo={resolvedIconEvo}
              iconHero={resolvedIconHero}
              displayMode={displayMode}
              fallbackBase={fallbackBase}
              fallbackEvo={fallbackEvo}
              fallbackHero={fallbackHero}
            />
          ) : (
            <div className="relative z-10 flex h-full w-full items-center justify-center text-sm font-bold text-cr-text">
              {name.charAt(0)}
            </div>
          )}
        </div>
        {(isCollection || size === "lg" || size === "deck") && levelBadge != null && (
          <LevelBadge level={levelBadge} />
        )}
        {showElixir && (
          <ElixirCostBadge cost={resolvedElixir} size={isCollection ? "lg" : "md"} />
        )}
        {!isCollection && size !== "lg" && size !== "deck" && levelBadge != null && (
          <span
            className={cn(
              "absolute top-0 z-50 min-w-[1.1rem] rounded-md border border-cr-gold/40 bg-cr-bg/95 px-1 py-0.5 text-2xs font-sans font-extrabold leading-none text-white pointer-events-none card-level-chip",
              levelBadgeAnchor === "top-left" ? "left-0" : "right-0",
            )}
          >
            {levelBadge}
          </span>
        )}
        {badge != null && (
          <span className="absolute bottom-0.5 right-0.5 z-20 rounded border border-cr-gold/30 bg-cr-bg/90 px-1 py-0.5 text-2xs font-bold text-cr-gold">
            {badge}
          </span>
        )}
      </div>
      {showLabel && !overlayLabel && (
        <span
          className={cn(
            belowCaption
              ? cn("card-name-caption", size === "lg" && "card-name-caption--lg")
              : "card-name-glow truncate px-0.5 text-center font-extrabold leading-none",
            !belowCaption && labelSizeClasses[size],
            labelClassName,
          )}
          title={nameRu(name)}
        >
          {label}
        </span>
      )}
    </div>
  );
});

interface CardDeckGridProps {
  cards: string[];
  icons?: string[];
  levels?: Array<string | number | null | undefined>;
  levelWarnings?: boolean[];
  size?: CardTileSize;
  showLabels?: boolean;
  maxVisible?: number;
  className?: string;
}

export function CardDeckGrid({
  cards,
  icons,
  levels,
  levelWarnings,
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
      <div
        className={cn(
          "grid grid-cols-4 grid-rows-2 w-full",
          showLabels ? "gap-x-2 gap-y-3" : "gap-x-2 gap-y-1.5",
        )}
      >
        {slots.map((name, index) => (
          <div key={name ? `${name}-${index}` : `empty-${index}`} className="min-w-0 overflow-visible">
            {name ? (
              <CardTile
                name={name}
                icon={icons?.[index]}
                size={size}
                showLabel={showLabels}
                levelBadge={levels?.[index] ?? undefined}
                className={levelWarnings?.[index] ? "ring-1 ring-cr-loss/70 rounded-lg" : undefined}
              />
            ) : null}
          </div>
        ))}
      </div>
      {hidden > 0 ? (
        <p className="mt-1 text-center text-sm font-semibold text-cr-muted">+{hidden}</p>
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
          <p className="card-name-glow max-w-[5rem] truncate px-0.5 text-center text-sm" title={nameRu(item.name)}>
            {nameShort(item.name)}
          </p>
          <p className="text-2xs font-semibold text-cr-accent">
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
