import { cn } from "@/utils";
import { CardTile } from "./CardTile";
import { resolveCardDisplayMode } from "./cardDisplayMode";
import type { CardDisplayMode, DeckCard } from "@/types";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";

type DeckGridSize = "xs" | "sm" | "md" | "lg" | "deck";

/** @deprecated use resolveCardDisplayMode */
export function cardDisplayMode(
  card: Pick<DeckCard, "is_hero" | "evolution_level">,
): CardDisplayMode {
  if (card.is_hero) return "hero";
  if ((card.evolution_level ?? 0) >= 1) return "evo";
  return "base";
}

/** Normalize API deck cards or plain names into a slot-ordered DeckCard[]. */
export function toDeckCards(
  cards: Array<DeckCard | string> | null | undefined,
): DeckCard[] {
  if (!cards?.length) return [];
  return cards.map((card, slot) => {
    if (typeof card === "string") {
      return {
        id: `${card}-${slot}`,
        name: card,
        icon: "",
        cost: 0,
        evolution_level: 0,
        is_hero: false,
        slot,
      };
    }
    return {
      ...card,
      id: card.id || `${card.name}-${slot}`,
      icon: card.icon || "",
      cost: card.cost ?? 0,
      slot: card.slot ?? slot,
    };
  });
}

interface PlayerDeckGridProps {
  cards: Array<DeckCard | string> | null | undefined;
  size?: DeckGridSize;
  showLabels?: boolean;
  className?: string;
  gapClassName?: string;
  levelBadgeAnchor?: "top-left" | "top-right";
}

/** Player/profile decks with evolution and hero art (as in Clash Royale). */
export function PlayerDeckGrid({
  cards,
  size = "deck",
  showLabels = false,
  className,
  gapClassName,
  levelBadgeAnchor,
}: PlayerDeckGridProps) {
  const { getCard } = useCardCatalog();
  const items = toDeckCards(cards)
    .slice(0, 8)
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  const gaps =
    gapClassName ??
    (showLabels || size === "lg" ? "gap-x-2 gap-y-3" : size === "xs" ? "gap-1" : "gap-x-2 gap-y-1");

  return (
    <div className={cn("grid grid-cols-4 grid-rows-2 w-full", gaps, className)}>
      {items.map((card, index) => {
        const mode = resolveCardDisplayMode(card, getCard(card.name));
        return (
          <div key={`${card.id}-${index}`} className="min-w-0 overflow-visible">
            <CardTile
              name={card.name}
              icon={card.icon}
              size={size}
              showLabel={showLabels}
              displayMode={mode}
              iconEvo={getCard(card.name)?.icon_evo || card.icon}
              iconHero={getCard(card.name)?.icon_hero || card.icon}
              elixirCost={card.cost > 0 ? card.cost : undefined}
              rarity={card.rarity}
              levelBadge={card.level != null && card.level > 0 ? card.level : undefined}
              levelBadgeAnchor={levelBadgeAnchor}
            />
          </div>
        );
      })}
    </div>
  );
}
