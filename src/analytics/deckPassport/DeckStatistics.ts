import { avgElixir, cardCanTargetAir, cardHasRole, getCardMeta } from "@/services/deckBuilder/database";
import { isSpellCard, isWinCard } from "@/services/deckBuilder/balance";
import { CHAMPION_CARDS, LEGENDARY_CARDS } from "./constants/ratings";
import type { DeckCard } from "@/types";

export interface DeckBasicInfo {
  avgElixir: number;
  primaryWinCondition: string;
  deckType: string;
  spellCount: number;
  buildingCount: number;
  /** Count of anti-air cards (can_target_air) — not flying units. */
  airCount: number;
  supportCount: number;
  cycleCount: number;
}

function isBuilding(name: string): boolean {
  return cardHasRole(name, "building");
}

function isAntiAir(name: string): boolean {
  return cardCanTargetAir(name);
}

function isSupport(name: string): boolean {
  return cardHasRole(name, "support") || cardHasRole(name, "dps");
}

function isCycle(name: string): boolean {
  const meta = getCardMeta(name);
  return cardHasRole(name, "cycle") || (meta?.elixir ?? 4) <= 2;
}

export function collectCardNames(cards: DeckCard[]): string[] {
  return cards.map((c) => c.name).filter(Boolean);
}

export function computeBasicInfo(cardNames: string[], deckType: string): DeckBasicInfo {
  const wins = cardNames.filter(isWinCard);
  const primaryWin =
    wins[0] ?? cardNames.find((c) => cardHasRole(c, "win_condition")) ?? "—";

  return {
    avgElixir: avgElixir(cardNames),
    primaryWinCondition: primaryWin,
    deckType,
    spellCount: cardNames.filter(isSpellCard).length,
    buildingCount: cardNames.filter(isBuilding).length,
    airCount: cardNames.filter(isAntiAir).length,
    supportCount: cardNames.filter(isSupport).length,
    cycleCount: cardNames.filter(isCycle).length,
  };
}

export function countLegendaries(cardNames: string[], cards: DeckCard[]): number {
  const fromDeck = cards.filter(
    (c) => c.rarity === "legendary" || c.rarity === "champion",
  ).length;
  if (fromDeck > 0) return fromDeck;
  return cardNames.filter((n) => LEGENDARY_CARDS.has(n)).length;
}

export function countChampions(cardNames: string[], cards: DeckCard[]): number {
  const fromDeck = cards.filter((c) => c.rarity === "champion").length;
  if (fromDeck > 0) return fromDeck;
  return cardNames.filter((n) => CHAMPION_CARDS.has(n)).length;
}

export function countEvolutions(cards: DeckCard[]): number {
  return cards.filter((c) => (c.evolution_level ?? 0) >= 1).length;
}
