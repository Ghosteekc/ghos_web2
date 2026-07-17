import {
  ARCHETYPE_ANCHORS,
  GENERIC_CARDS,
  MATCH_CONFIDENCE_THRESHOLD,
  WEIGHT_ARCHETYPE,
  WEIGHT_CARD_MATCH,
  WEIGHT_ELIXIR,
  WEIGHT_POPULARITY,
  WEIGHT_SYNERGY,
  WIN_CONDITIONS,
} from "./constants";
import {
  balanceIssues,
  finalizeDeck,
  fillersFromTemplate,
  meaningfulOverlap,
  templateIsUsable,
} from "./balance";
import {
  avgElixir,
  candidateDeckIndices,
  cardRoles,
  getAllCards,
  getAllDecks,
} from "./database";
import { deckSynergyScore, pairSynergy } from "./synergy";
import type { BuildResult, DeckRecord, ScoredDeck } from "./types";

function detectArchetype(core: string[]): string {
  const coreWins = core.filter((c) => WIN_CONDITIONS.has(c));
  for (const win of coreWins) {
    if (["Lava Hound", "Balloon"].includes(win)) return "Lava";
    if (["Golem", "Giant", "Electro Giant"].includes(win)) return "Beatdown";
    if (win === "Royal Giant") return "Royal Giant";
    if (["Hog Rider", "Battle Ram"].includes(win)) return "Cycle";
    if (win === "Goblin Barrel") return "Log Bait";
    if (win === "Graveyard") return "Graveyard";
    if (["X-Bow", "Mortar"].includes(win)) return "Siege";
    if (["P.E.K.K.A", "Mega Knight", "Royal Ghost", "Bandit"].includes(win)) return "Bridge Spam";
    if (win === "Miner") return "Control";
  }

  const coreSet = new Set(core);
  let best = "Meta";
  let bestHits = 0;
  for (const [archetype, anchors] of Object.entries(ARCHETYPE_ANCHORS)) {
    let hits = 0;
    for (const a of anchors) if (coreSet.has(a)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      best = archetype;
    }
  }
  if (bestHits > 0) return best;

  if (core.some((c) => ["X-Bow", "Mortar"].includes(c))) return "Siege";
  const avg = avgElixir(core);
  if (avg <= 3.3) return "Cycle";
  if (avg >= 4.0) return "Beatdown";
  return best;
}

function overlapScore(core: string[], templateCards: string[]): number {
  const coreSet = new Set(core);
  let score = 0;
  for (const card of templateCards) {
    if (!coreSet.has(card)) continue;
    score += GENERIC_CARDS.has(card) ? 0.5 : 4.0;
    if (WIN_CONDITIONS.has(card)) score += 6.0;
  }
  return score;
}

function coreSynergyWithDeck(core: string[], deckCards: string[]): number {
  let total = 0;
  let n = 0;
  for (const c of core) {
    for (const d of deckCards) {
      if (c !== d) {
        total += pairSynergy(c, d);
        n++;
      }
    }
  }
  return n ? total / n : 0;
}

function scoreDeckMatch(core: string[], archetype: string, record: DeckRecord): ScoredDeck | null {
  if (!templateIsUsable(core, record)) return null;

  const weightedOverlap = overlapScore(core, record.cards);
  const cardScore = weightedOverlap * (WEIGHT_CARD_MATCH / 4);
  const archScore = record.archetype === archetype ? WEIGHT_ARCHETYPE : 0;
  const elixirDiff = Math.abs(record.avgElixir - avgElixir(core));
  const elixirScore = Math.max(0, WEIGHT_ELIXIR - elixirDiff * 5);
  const synScore = (coreSynergyWithDeck(core, record.cards) / 100) * WEIGHT_SYNERGY;
  const popScore = ((record.popularity ?? 50) / 100) * WEIGHT_POPULARITY;

  const raw = cardScore + archScore + elixirScore + synScore + popScore;
  const maxPossible =
    4 * WEIGHT_CARD_MATCH + WEIGHT_ARCHETYPE + WEIGHT_ELIXIR + WEIGHT_SYNERGY + WEIGHT_POPULARITY;
  const confidence = Math.min(100, (raw / maxPossible) * 100);
  const overlap = meaningfulOverlap(core, record.cards).length;

  return { record, score: raw, confidence, overlap };
}

function rankSimilar(core: string[], archetype: string, limit: number): ScoredDeck[] {
  const decks = getAllDecks();
  const indices = candidateDeckIndices(core);
  const scored: ScoredDeck[] = [];

  for (const idx of indices) {
    const sd = scoreDeckMatch(core, archetype, decks[idx]);
    if (sd) scored.push(sd);
  }
  if (!scored.length) {
    for (const d of decks) {
      const sd = scoreDeckMatch(core, archetype, d);
      if (sd) scored.push(sd);
    }
  }
  scored.sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.overlap - a.overlap);
  return scored.slice(0, limit);
}

function buildOneVariant(
  core: string[],
  pool: Set<string>,
  archetype: string,
  template?: DeckRecord,
  fillerSkip = 0,
): string[] {
  let fillers = template ? fillersFromTemplate(core, template) : [];
  if (fillerSkip > 0) fillers = fillers.slice(fillerSkip);
  let deck = [...core];
  for (const card of fillers) {
    if (deck.length >= 8) break;
    if (!deck.includes(card)) deck.push(card);
  }
  return finalizeDeck(deck, core, pool, template?.archetype ?? archetype);
}

export function buildDeckFromCore(core: string[], pool?: Set<string>): BuildResult {
  if (core.length !== 4 || new Set(core).size !== 4) {
    throw new Error("Нужно ровно 4 уникальные карты");
  }

  const allCards = getAllCards();
  const cardPool = pool ?? new Set(Object.keys(allCards));
  for (const c of core) cardPool.add(c);

  const archetype = detectArchetype(core);
  const ranked = rankSimilar(core, archetype, 6);
  const best = ranked[0];

  const deck = buildOneVariant(core, cardPool, archetype, best?.record);
  const issues = balanceIssues(deck, archetype);

  return {
    deck,
    archetype,
    averageElixir: avgElixir(deck),
    synergyScore: deckSynergyScore(deck),
    confidence: Math.round((best?.confidence ?? 40) * 10) / 10,
    sourceDeckId: best?.record.id,
    sourceDeckName: undefined,
    balanced: issues.length === 0,
  };
}

function deckKey(deck: string[]): string {
  return [...deck].sort().join("|");
}

function dedupeBuildResults(results: BuildResult[]): BuildResult[] {
  const out: BuildResult[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    const key = deckKey(item.deck);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function buildMultipleDecks(core: string[], limit = 6): BuildResult[] {
  const archetype = detectArchetype(core);
  const ranked = rankSimilar(core, archetype, limit * 5);
  const allCards = getAllCards();
  const pool = new Set(Object.keys(allCards));
  for (const c of core) pool.add(c);

  const results: BuildResult[] = [];
  const seen = new Set<string>();

  for (const sd of ranked) {
    if (results.length >= limit) break;
    for (const fillerSkip of [0, 1, 2]) {
      const deck = buildOneVariant(core, pool, archetype, sd.record, fillerSkip);
      if (deck.length !== 8 || balanceIssues(deck, sd.record.archetype).includes("win_condition")) {
        continue;
      }
      const key = deckKey(deck);
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        deck,
        archetype: sd.record.archetype,
        averageElixir: avgElixir(deck),
        synergyScore: deckSynergyScore(deck),
        confidence: Math.round(sd.confidence * 10) / 10,
        sourceDeckId: sd.record.id,
        sourceDeckName: undefined,
        balanced: balanceIssues(deck, sd.record.archetype).length === 0,
      });
      break;
    }
  }

  if (!results.length) {
    const fallback = buildOneVariant(core, pool, archetype);
    seen.add(deckKey(fallback));
    results.push({
      deck: fallback,
      archetype,
      averageElixir: avgElixir(fallback),
      synergyScore: deckSynergyScore(fallback),
      confidence: 35,
      balanced: balanceIssues(fallback, archetype).length === 0,
    });
  }

  const genericFallback = finalizeDeck(core, core, pool, archetype);
  const gKey = deckKey(genericFallback);
  if (!seen.has(gKey) && results.length < limit) {
    results.push({
      deck: genericFallback,
      archetype,
      averageElixir: avgElixir(genericFallback),
      synergyScore: deckSynergyScore(genericFallback),
      confidence: 30,
      balanced: balanceIssues(genericFallback, archetype).length === 0,
    });
  }

  results.sort((a, b) => b.synergyScore + b.confidence - (a.synergyScore + a.confidence));
  return dedupeBuildResults(results).slice(0, limit);
}

export { detectArchetype, rankSimilar, balanceIssues };
