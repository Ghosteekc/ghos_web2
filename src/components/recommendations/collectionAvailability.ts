export type CardCollectionAvailability =
  | { status: "owned"; level: number | null }
  | { status: "missing" }
  | { status: "unknown" };

type CollectionCardLike = {
  name?: unknown;
  owned?: unknown;
  level?: unknown;
};

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("en");
}

/** Resolves one proposed card using only an explicit entry in the collection response. */
export function getCardCollectionAvailability(
  cardName: string,
  cards: unknown,
): CardCollectionAvailability {
  if (!Array.isArray(cards)) return { status: "unknown" };

  const wanted = normalizeName(cardName);
  const entry = (cards as CollectionCardLike[]).find(
    (card) =>
      card &&
      typeof card.name === "string" &&
      normalizeName(card.name) === wanted,
  );
  if (!entry || typeof entry.owned !== "boolean") return { status: "unknown" };
  if (!entry.owned) return { status: "missing" };

  const level = entry.level;
  return {
    status: "owned",
    level: typeof level === "number" && Number.isFinite(level) && level > 0 ? level : null,
  };
}
