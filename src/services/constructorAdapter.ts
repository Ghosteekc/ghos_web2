import { buildMultipleDecks, synergyNotes, type BuildResult } from "@/services/deckBuilder";
import type { ConstructorDeckEntry, Deck, DeckCard } from "@/types";

type CatalogLike = {
  name: string;
  icon: string;
  id?: number | null;
  elixir?: number | null;
  max_evolution_level?: number;
  has_hero?: boolean;
  icon_evo?: string;
  icon_hero?: string;
};

const SLOT_EVO = new Set([0, 2]);
const SLOT_HERO = new Set([1]);

function slotVariant(
  slotIndex: number,
  card: CatalogLike,
): { evolution_level: number; is_hero: boolean; icon: string } {
  if (SLOT_HERO.has(slotIndex) && card.has_hero) {
    return { evolution_level: 0, is_hero: true, icon: card.icon_hero || card.icon };
  }
  if (SLOT_EVO.has(slotIndex) && (card.max_evolution_level ?? 0) >= 1) {
    return { evolution_level: 1, is_hero: false, icon: card.icon_evo || card.icon };
  }
  return { evolution_level: 0, is_hero: false, icon: card.icon };
}

function buildDeckLink(names: string[], catalog: Map<string, CatalogLike>): string | null {
  const ids: number[] = [];
  for (const name of names) {
    const id = catalog.get(name)?.id;
    if (id == null) return null;
    ids.push(id);
  }
  if (ids.length !== 8) return null;
  return `https://link.clashroyale.com/deck/ru?deck=${ids.join(";")}`;
}

function categoryFromArchetype(archetype: string): string {
  const map: Record<string, string> = {
    Cycle: "cycle",
    "Log Bait": "bait",
    Beatdown: "beatdown",
    Control: "control",
    Siege: "control",
    Lava: "beatdown",
    "Royal Giant": "meta",
    "Bridge Spam": "meta",
    Graveyard: "meta",
    "Fireball Bait": "bait",
    "Split Lane": "meta",
    Meta: "meta",
  };
  return map[archetype] ?? "meta";
}

function toDeckCard(
  name: string,
  slot: number,
  catalog: Map<string, CatalogLike>,
  isCore: boolean,
  coreSlot?: number,
): DeckCard {
  const info = catalog.get(name);
  const variant = isCore && coreSlot != null && info
    ? slotVariant(coreSlot, info)
    : { evolution_level: 0, is_hero: false, icon: info?.icon ?? "" };

  return {
    id: String(info?.id ?? name),
    name,
    icon: variant.icon || info?.icon || "",
    cost: info?.elixir ?? 4,
    evolution_level: variant.evolution_level,
    is_hero: variant.is_hero,
    slot,
  };
}

export function buildConstructorDecksLocal(
  slots: { name: string; slot: number }[],
  catalog: CatalogLike[],
  startId = 7000,
): { core: DeckCard[]; decks: ConstructorDeckEntry[] } {
  const catalogMap = new Map(catalog.map((c) => [c.name, c]));
  const coreNames = slots.map((s) => s.name);
  const results = buildMultipleDecks(coreNames, 6);

  const core: DeckCard[] = slots.map((s, i) =>
    toDeckCard(s.name, i, catalogMap, true, s.slot),
  );

  const decks: ConstructorDeckEntry[] = results.map((r: BuildResult, idx: number) => {
    const fillerNames = r.deck.filter((c: string) => !coreNames.includes(c));
    const cards: DeckCard[] = [
      ...core,
      ...fillerNames.map((name: string, j: number) =>
        toDeckCard(name, 4 + j, catalogMap, false),
      ),
    ];

    const notes = synergyNotes(r.deck);

    return {
      id: startId + idx,
      name: "",
      cards,
      synergy_score: r.synergyScore,
      synergy_notes: notes,
      avg_elixir: r.averageElixir,
      deck_link: buildDeckLink(r.deck, catalogMap),
      description: `Синергия ${r.synergyScore.toFixed(0)}% · эликсир ${r.averageElixir.toFixed(1)}`,
      type: "constructor",
      category: categoryFromArchetype(r.archetype),
      archetype: r.archetype,
      confidence: r.confidence,
    };
  });

  decks.sort(
    (a, b) =>
      (b.confidence ?? 0) + b.synergy_score - ((a.confidence ?? 0) + a.synergy_score),
  );

  const unique: ConstructorDeckEntry[] = [];
  const seenDecks = new Set<string>();
  for (const deck of decks) {
    const key = deck.cards.map((c) => c.name).sort().join("|");
    if (seenDecks.has(key)) continue;
    seenDecks.add(key);
    unique.push(deck);
  }

  return { core, decks: unique };
}

export function constructorEntryToDeck(entry: ConstructorDeckEntry): Deck {
  return {
    id: entry.id,
    name: entry.name,
    cards: entry.cards,
    winrate: entry.synergy_score,
    total_games: 0,
    avg_elixir: entry.avg_elixir,
    type: "constructor",
    category: entry.category,
    deck_link: entry.deck_link,
    description: entry.description,
    best_matchups: [],
    worst_matchups: [],
    synergy_score: entry.synergy_score,
    synergy_notes: entry.synergy_notes,
    archetype: entry.archetype,
    confidence: entry.confidence,
  } as Deck & { archetype?: string; confidence?: number };
}
