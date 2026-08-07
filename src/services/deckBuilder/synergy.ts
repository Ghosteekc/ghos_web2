import {
  KNOWN_SYNERGY,
  SYNERGY_PARTIAL,
  SYNERGY_STRONG,
  SYNERGY_WEAK,
  WIN_CONDITIONS,
} from "./constants";
import { cardRoles, getCardMeta, getSynergyPairScore } from "./database";

const SPIRIT_CARDS = new Set([
  "Ice Spirit",
  "Fire Spirit",
  "Electro Spirit",
  "Heal Spirit",
]);

function isSpiritCard(name: string): boolean {
  return SPIRIT_CARDS.has(name);
}

function isSpellCard(name: string): boolean {
  return (
    getCardMeta(name)?.type === "spell" ||
    cardRoles(name).has("spell") ||
    cardRoles(name).has("small_spell") ||
    cardRoles(name).has("big_spell")
  );
}

function isBuildingCard(name: string): boolean {
  const meta = getCardMeta(name);
  return meta?.type === "building" || cardRoles(name).has("building");
}

/** Атакующая карта — win condition (Hog, Wall Breakers, Miner и т.д.). */
function isAttackingCard(name: string): boolean {
  return WIN_CONDITIONS.has(name);
}

/** Духи/здания/заклинания не синергируют между собой. */
function isBlockedSynergyPair(a: string, b: string): boolean {
  const aSpirit = isSpiritCard(a);
  const bSpirit = isSpiritCard(b);
  const aSpell = isSpellCard(a);
  const bSpell = isSpellCard(b);
  const aBuilding = isBuildingCard(a);
  const bBuilding = isBuildingCard(b);

  if (aSpirit && (bSpell || bBuilding)) return true;
  if (bSpirit && (aSpell || aBuilding)) return true;
  if (aSpell && bBuilding) return true;
  if (aSpell && bSpell) return true;
  return false;
}

/** Синергия только с участием атакующей карты (Hog + Valkyrie, Wall Breakers + Electro Spirit). */
export function isValidSynergyPair(a: string, b: string): boolean {
  if (isBlockedSynergyPair(a, b)) return false;
  return isAttackingCard(a) || isAttackingCard(b);
}

export function pairSynergy(a: string, b: string): number {
  if (!isValidSynergyPair(a, b)) return SYNERGY_WEAK;
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
      if (!isValidSynergyPair(cards[i], cards[j])) continue;
      const s = pairSynergy(cards[i], cards[j]);
      total += s >= SYNERGY_STRONG ? s : s >= SYNERGY_PARTIAL ? s : SYNERGY_WEAK;
      pairs++;
    }
  }
  if (pairs === 0) return 50;
  return Math.round((total / pairs) * 10) / 10;
}

export function synergyNotes(
  cards: string[],
  limit = 4,
  nameRu: (name: string) => string = (n) => n,
): string[] {
  const notes: string[] = [];
  for (let i = 0; i < cards.length && notes.length < limit; i++) {
    for (let j = i + 1; j < cards.length && notes.length < limit; j++) {
      if (!isValidSynergyPair(cards[i], cards[j])) continue;
      const s = pairSynergy(cards[i], cards[j]);
      if (s >= SYNERGY_STRONG) {
        notes.push(`${nameRu(cards[i])} + ${nameRu(cards[j])}`);
      }
    }
  }
  return notes;
}
