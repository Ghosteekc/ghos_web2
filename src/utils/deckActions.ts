import type { Deck, DeckCard } from "@/types";

/** Build /decks/compare URL for an 8-card reference deck. */
export function buildDeckComparePath(
  cards: Array<string | Pick<DeckCard, "name" | "level">>,
  name: string,
  from: string,
): string {
  const names = cards.map((c) => (typeof c === "string" ? c : c.name)).filter(Boolean);
  if (names.length !== 8) return "";
  const ref = names.map(encodeURIComponent).join("|");
  const encodedName = encodeURIComponent(name || "Колода");
  const encodedFrom = encodeURIComponent(from || "decks");
  const levels = cards.map((card) => (typeof card === "string" ? "" : String(card.level ?? "")));
  const levelParam = levels.some(Boolean) ? `&lv=${levels.join("|")}` : "";
  return `/decks/compare?ref=${ref}&name=${encodedName}&from=${encodedFrom}${levelParam}`;
}

export function deckToComparePath(deck: Deck, from: string): string {
  return buildDeckComparePath(deck.cards ?? [], deck.name || "Колода", from);
}

/** Minimal Deck object for DeckPassport from card names. */
export function deckFromCardNames(
  names: string[],
  opts?: {
    id?: number;
    name?: string;
    avgElixir?: number;
    winrate?: number;
    totalGames?: number;
    type?: Deck["type"];
    deckLink?: string | null;
    icons?: Record<string, string>;
  },
): Deck | null {
  if (names.length !== 8) return null;
  return {
    id: opts?.id ?? 0,
    name: opts?.name ?? "Колода",
    cards: names.map((name, slot) => ({
      id: `${name}-${slot}`,
      name,
      icon: opts?.icons?.[name] ?? "",
      cost: 0,
      evolution_level: 0,
      is_hero: false,
      slot,
    })),
    winrate: opts?.winrate ?? 0,
    total_games: opts?.totalGames ?? 0,
    avg_elixir: opts?.avgElixir ?? 0,
    best_matchups: [],
    worst_matchups: [],
    type: opts?.type ?? "meta",
    deck_link: opts?.deckLink ?? null,
  };
}
