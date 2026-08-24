import type { CardCatalogItem } from "@/hooks/CardCatalogProvider";
import type { CardDisplayMode, DeckCard } from "@/types";

type DeckCardLike = Pick<DeckCard, "is_hero" | "evolution_level" | "icon" | "name">;

/** Resolve evo / hero / split display from deck flags, with catalog + icon fallback. */
export function resolveCardDisplayMode(
  card: DeckCardLike,
  catalog?: CardCatalogItem | null,
): CardDisplayMode {
  if (card.is_hero) return "hero";
  if ((card.evolution_level ?? 0) >= 1) return "evo";

  const icon = (card.icon || "").trim();
  if (!icon || !catalog) return "base";

  const evoIcon = (catalog.icon_evo || "").trim();
  const heroIcon = (catalog.icon_hero || "").trim();
  const baseIcon = (catalog.icon || "").trim();

  if (heroIcon && icon === heroIcon) return "hero";
  if (evoIcon && icon === evoIcon) return "evo";
  if (catalog.has_hero && heroIcon && icon.includes("hero")) return "hero";
  if (evoIcon && icon.includes("evolution")) return "evo";
  if (evoIcon && icon !== baseIcon && baseIcon && icon !== heroIcon) return "evo";

  return "base";
}

export function cardUpgradeWrapClass(
  displayMode: CardDisplayMode,
  rarity?: string,
): string | null {
  if (rarity === "champion") return "card-tile-wrap--hero";
  switch (displayMode) {
    case "evo":
      return "card-tile-wrap--evo";
    case "hero":
      return "card-tile-wrap--hero";
    case "split":
      return "card-tile-wrap--split";
    default:
      return null;
  }
}

export function cardUpgradeRimClass(
  displayMode: CardDisplayMode,
  rarity?: string,
): string | null {
  if (rarity === "champion") return "card-tile-rim--hero";
  switch (displayMode) {
    case "evo":
      return "card-tile-rim--evo";
    case "hero":
      return "card-tile-rim--hero";
    case "split":
      return "card-tile-rim--split";
    default:
      return null;
  }
}
