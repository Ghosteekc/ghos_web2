/** Ключ колоды для сравнения (порядок карт не важен). */
export function normalizeDeckKey(cards: string[]): string {
  return [...cards].sort().join("|");
}

export function buildFavoriteMap(decks: string[][]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const deck of decks) {
    if (deck.length === 8) {
      map.set(normalizeDeckKey(deck), deck);
    }
  }
  return map;
}
