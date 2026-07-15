import {
  KNOWN_SYNERGY,
  SYNERGY_PARTIAL,
  SYNERGY_STRONG,
  SYNERGY_WEAK,
} from "./constants";
import { getSynergyPairScore } from "./database";

export function pairSynergy(a: string, b: string): number {
  const sorted = [a, b].sort();
  const key = `${sorted[0]}|${sorted[1]}`;
  if (KNOWN_SYNERGY[key]) return KNOWN_SYNERGY[key];
  const fromDb = getSynergyPairScore(a, b);
  if (fromDb !== undefined) return fromDb;
  return SYNERGY_WEAK;
}

export function deckSynergyScore(cards: string[]): number {
  if (cards.length < 2) return 50;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const s = pairSynergy(cards[i], cards[j]);
      total += s >= SYNERGY_STRONG ? s : s >= SYNERGY_PARTIAL ? s : SYNERGY_WEAK;
      pairs++;
    }
  }
  return Math.round((total / pairs) * 10) / 10;
}

export function synergyNotes(cards: string[], limit = 4): string[] {
  const notes: string[] = [];
  for (let i = 0; i < cards.length && notes.length < limit; i++) {
    for (let j = i + 1; j < cards.length && notes.length < limit; j++) {
      const s = pairSynergy(cards[i], cards[j]);
      if (s >= SYNERGY_STRONG) {
        notes.push(`${cards[i]} + ${cards[j]}`);
      }
    }
  }
  return notes;
}
