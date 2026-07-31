import type { ConstructorData, ConstructorDeckEntry, Deck } from "@/types";
import { api, ApiError } from "@/api/client";

export function constructorEntryToDeck(entry: ConstructorDeckEntry): Deck {
  return {
    id: entry.id,
    name: entry.name,
    cards: entry.cards,
    winrate: entry.synergy_score,
    total_games: 0,
    avg_elixir: entry.avg_elixir,
    type: entry.is_alternative ? "constructor_alt" : "constructor",
    category: entry.category,
    deck_link: entry.deck_link,
    description: entry.description,
    best_matchups: [],
    worst_matchups: [],
    synergy_score: entry.synergy_score,
    synergy_notes: entry.synergy_notes,
    archetype: entry.archetype,
    confidence: entry.confidence,
    recommendation: entry.recommendation ?? null,
    game_plan: entry.game_plan ?? null,
    improvements: entry.improvements ?? [],
    score_breakdown: entry.score_breakdown,
  };
}

function constructorApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Не удалось собрать колоды";
}

export type ConstructorBuildResult = {
  decks: Deck[];
  alternativeDeck: Deck | null;
  coreConflict: ConstructorData["core_conflict"];
};

/** Генерация колод через backend (единственный источник истины для конструктора). */
export async function fetchConstructorDecks(
  slots: { name: string; slot: number }[],
): Promise<ConstructorBuildResult> {
  const data = await api.buildConstructorDecks(slots);
  return {
    decks: data.decks.map(constructorEntryToDeck),
    alternativeDeck: data.alternative_deck
      ? constructorEntryToDeck(data.alternative_deck)
      : null,
    coreConflict: data.core_conflict ?? null,
  };
}

export { constructorApiErrorMessage };

/**
 * @deprecated Локальная генерация отключена — SoT рекомендаций: BE RecommendationEngine.
 */
export function buildConstructorDecksLocal(): { core: never[]; decks: never[] } {
  console.warn(
    "[constructor] buildConstructorDecksLocal deprecated — use fetchConstructorDecks",
  );
  return { core: [], decks: [] };
}
