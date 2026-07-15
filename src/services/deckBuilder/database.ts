import cardsData from "@/data/cards.json";
import decksData from "@/data/decks.json";
import type { CardMeta, CardsData, DeckRecord, DecksData } from "./types";

let _cards: Record<string, CardMeta> | null = null;
let _decks: DeckRecord[] | null = null;
let _synergyPairs: Record<string, number> | null = null;
let _byCard: Map<string, number[]> | null = null;

function ensureLoaded() {
  if (_cards) return;
  const cd = cardsData as CardsData;
  const dd = decksData as DecksData;
  _cards = cd.cards;
  _decks = dd.decks.filter((d) => d.cards.length === 8);
  _synergyPairs = dd.synergyPairs ?? {};
  _byCard = new Map();
  _decks.forEach((deck, idx) => {
    for (const card of deck.cards) {
      const list = _byCard!.get(card) ?? [];
      list.push(idx);
      _byCard!.set(card, list);
    }
  });
}

export function getCardMeta(name: string): CardMeta | undefined {
  ensureLoaded();
  return _cards![name];
}

export function getAllCards(): Record<string, CardMeta> {
  ensureLoaded();
  return _cards!;
}

export function getAllDecks(): DeckRecord[] {
  ensureLoaded();
  return _decks!;
}

export function getSynergyPairScore(a: string, b: string): number | undefined {
  ensureLoaded();
  const k1 = `${a}|${b}`;
  const k2 = `${b}|${a}`;
  return _synergyPairs![k1] ?? _synergyPairs![k2];
}

export function candidateDeckIndices(core: string[]): number[] {
  ensureLoaded();
  const sets = core.map((c) => new Set(_byCard!.get(c) ?? []));
  const nonEmpty = sets.filter((s) => s.size > 0);
  if (nonEmpty.length === 0) return _decks!.map((_, i) => i);

  let inter = new Set(nonEmpty[0]);
  for (let i = 1; i < nonEmpty.length; i++) {
    const next = new Set<number>();
    for (const v of inter) {
      if (nonEmpty[i].has(v)) next.add(v);
    }
    inter = next;
    if (inter.size === 0) break;
  }
  if (inter.size > 0) return [...inter].sort((a, b) => a - b);

  const union = new Set<number>();
  for (const s of nonEmpty) for (const v of s) union.add(v);
  return union.size > 0 ? [...union].sort((a, b) => a - b) : _decks!.map((_, i) => i);
}

export function avgElixir(cards: string[]): number {
  ensureLoaded();
  if (!cards.length) return 0;
  const sum = cards.reduce((acc, c) => acc + (_cards![c]?.elixir ?? 4), 0);
  return Math.round((sum / cards.length) * 100) / 100;
}

export function cardRoles(name: string): ReadonlySet<string> {
  return new Set(getCardMeta(name)?.roles ?? []);
}
