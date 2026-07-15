import {
  ARCHETYPE_ANCHORS,
  ARCHETYPE_ELIXIR,
  DEFAULT_ELIXIR_MAX,
  DEFAULT_ELIXIR_MIN,
  FILL_PRIORITY,
  MATCH_CONFIDENCE_THRESHOLD,
  SYNERGY_MIN_THRESHOLD,
  WEIGHT_ARCHETYPE,
  WEIGHT_CARD_MATCH,
  WEIGHT_ELIXIR,
  WEIGHT_POPULARITY,
  WEIGHT_SYNERGY,
  WIN_CONDITIONS,
} from "./constants";
import {
  avgElixir,
  candidateDeckIndices,
  cardRoles,
  getAllCards,
  getAllDecks,
} from "./database";
import { deckSynergyScore, pairSynergy } from "./synergy";
import type { Archetype, BuildResult, DeckRecord, ScoredDeck } from "./types";

function detectArchetype(core: string[]): string {
  const coreSet = new Set(core);
  let best: string = "Meta";
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

  const wins = core.filter((c) => WIN_CONDITIONS.has(c));
  if (wins.some((c) => c === "Lava Hound" || c === "Balloon") || core.includes("Lava Hound"))
    return "Lava";
  if (wins.some((c) => ["Golem", "Giant", "Electro Giant"].includes(c))) return "Beatdown";
  if (wins.includes("Royal Giant")) return "Royal Giant";
  if (wins.some((c) => ["Hog Rider", "Battle Ram"].includes(c))) return "Cycle";
  if (wins.includes("Goblin Barrel")) return "Log Bait";
  if (wins.includes("Graveyard")) return "Graveyard";
  if (core.some((c) => ["X-Bow", "Mortar"].includes(c))) return "Siege";
  if (wins.some((c) => ["P.E.K.K.A", "Mega Knight"].includes(c))) return "Bridge Spam";
  if (wins.includes("Miner")) return "Control";

  const avg = avgElixir(core);
  if (avg <= 3.3) return "Cycle";
  if (avg >= 4.0) return "Beatdown";
  return best;
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

function scoreDeckMatch(core: string[], archetype: string, record: DeckRecord): ScoredDeck {
  const coreSet = new Set(core);
  const overlap = record.cards.filter((c) => coreSet.has(c)).length;

  const cardScore = overlap * WEIGHT_CARD_MATCH;
  const archScore = record.archetype === archetype ? WEIGHT_ARCHETYPE : 0;
  const elixirDiff = Math.abs(record.avgElixir - avgElixir(core));
  const elixirScore = Math.max(0, WEIGHT_ELIXIR - elixirDiff * 5);
  const synScore = (coreSynergyWithDeck(core, record.cards) / 100) * WEIGHT_SYNERGY;
  const popScore = ((record.popularity ?? 50) / 100) * WEIGHT_POPULARITY;

  const raw = cardScore + archScore + elixirScore + synScore + popScore;
  const maxPossible =
    4 * WEIGHT_CARD_MATCH + WEIGHT_ARCHETYPE + WEIGHT_ELIXIR + WEIGHT_SYNERGY + WEIGHT_POPULARITY;
  const confidence = Math.min(100, (raw / maxPossible) * 100);

  return { record, score: raw, confidence, overlap };
}

function rankSimilar(core: string[], archetype: string, limit: number): ScoredDeck[] {
  const decks = getAllDecks();
  const indices = candidateDeckIndices(core);
  const scored: ScoredDeck[] = [];

  for (const idx of indices) {
    const sd = scoreDeckMatch(core, archetype, decks[idx]);
    if (sd.overlap >= 1 || sd.record.archetype === archetype) scored.push(sd);
  }
  if (!scored.length) {
    for (const d of decks) scored.push(scoreDeckMatch(core, archetype, d));
  }
  scored.sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.overlap - a.overlap);
  return scored.slice(0, limit);
}

function elixirBounds(archetype: string): [number, number] {
  return ARCHETYPE_ELIXIR[archetype] ?? [DEFAULT_ELIXIR_MIN, DEFAULT_ELIXIR_MAX];
}

function hasRole(deck: string[], role: string): boolean {
  return deck.some((c) => cardRoles(c).has(role));
}

function countRole(deck: string[], role: string): number {
  return deck.filter((c) => cardRoles(c).has(role)).length;
}

function balanceIssues(deck: string[], archetype: string): string[] {
  const [lo, hi] = elixirBounds(archetype);
  const issues: string[] = [];
  const avg = avgElixir(deck);

  if (!hasRole(deck, "win_condition") && !deck.some((c) => WIN_CONDITIONS.has(c)))
    issues.push("win_condition");
  if (!hasRole(deck, "big_spell")) issues.push("big_spell");
  if (!hasRole(deck, "small_spell")) issues.push("small_spell");
  if (countRole(deck, "air_defense") < 2) issues.push("air_defense");
  if (!hasRole(deck, "anti_tank")) issues.push("anti_tank");
  if (!hasRole(deck, "defensive")) issues.push("defensive");
  if (!hasRole(deck, "anti_swarm")) issues.push("anti_swarm");
  if (avg < lo - 0.3 || avg > hi + 0.3) issues.push("elixir");

  return issues;
}

function pickForRole(
  deck: string[],
  pool: Set<string>,
  role: string,
  archetype: string,
): string | undefined {
  const [lo, hi] = elixirBounds(archetype);
  const mid = (lo + hi) / 2;
  const candidates = [...pool].filter((c) => !deck.includes(c) && cardRoles(c).has(role));
  if (!candidates.length) return undefined;

  return candidates.sort((a, b) => {
    const synA = deck.reduce((s, x) => s + pairSynergy(a, x), 0) / deck.length;
    const synB = deck.reduce((s, x) => s + pairSynergy(b, x), 0) / deck.length;
    const elA = Math.abs(avgElixir([...deck, a]) - mid);
    const elB = Math.abs(avgElixir([...deck, b]) - mid);
    return synB - synA || elA - elB;
  })[0];
}

function autoComplete(
  deck: string[],
  core: string[],
  pool: Set<string>,
  archetype: string,
  templateFillers?: string[],
): string[] {
  const out = [...new Set(deck)];
  const coreSet = new Set(core);

  if (templateFillers) {
    for (const card of templateFillers) {
      if (out.length >= 8) break;
      if (pool.has(card) && !out.includes(card)) out.push(card);
    }
  }

  let issues = balanceIssues(out, archetype);
  for (const role of FILL_PRIORITY) {
    while (out.length < 8) {
      const need =
        issues.includes(role) ||
        (role === "win_condition" && !out.some((c) => WIN_CONDITIONS.has(c)));
      if (!need && hasRole(out, role)) break;
      const pick = pickForRole(out, pool, role, archetype);
      if (!pick) break;
      out.push(pick);
      issues = balanceIssues(out, archetype);
      if (!issues.includes(role)) break;
    }
  }

  const extras = [...pool]
    .filter((c) => !out.includes(c))
    .sort((a, b) => {
      const sa = out.reduce((s, x) => s + pairSynergy(a, x), 0);
      const sb = out.reduce((s, x) => s + pairSynergy(b, x), 0);
      return sb - sa;
    });
  for (const card of extras) {
    if (out.length >= 8) break;
    out.push(card);
  }

  return out.slice(0, 8);
}

function replaceWeakFillers(
  deck: string[],
  core: string[],
  pool: Set<string>,
  archetype: string,
): string[] {
  const coreSet = new Set(core);
  let out = [...deck];
  let score = deckSynergyScore(out);
  if (score >= SYNERGY_MIN_THRESHOLD) return out;

  const fillers = out.filter((c) => !coreSet.has(c));
  for (let round = 0; round < 3 && score < SYNERGY_MIN_THRESHOLD; round++) {
    const worst = fillers.sort((a, b) => {
      const sa = out.filter((x) => x !== a).reduce((s, x) => s + pairSynergy(a, x), 0);
      const sb = out.filter((x) => x !== b).reduce((s, x) => s + pairSynergy(b, x), 0);
      return sa - sb;
    })[0];
    if (!worst) break;

    const candidates = [...pool].filter((c) => !out.includes(c) && !coreSet.has(c));
    if (!candidates.length) break;

    const best = candidates.sort((a, b) => {
      const sa = out.map((x) => (x === worst ? a : x)).reduce((s, x, _, arr) => {
        let t = 0;
        for (let i = 0; i < arr.length; i++)
          for (let j = i + 1; j < arr.length; j++) t += pairSynergy(arr[i], arr[j]);
        return t;
      }, 0);
      const sb = out.map((x) => (x === worst ? b : x)).reduce((s, x, _, arr) => {
        let t = 0;
        for (let i = 0; i < arr.length; i++)
          for (let j = i + 1; j < arr.length; j++) t += pairSynergy(arr[i], arr[j]);
        return t;
      }, 0);
      return sb - sa;
    })[0];

    const idx = out.indexOf(worst);
    out[idx] = best;
    score = deckSynergyScore(out);
  }
  return out;
}

/** Шаг 1–7: собрать одну колоду из 4 карт ядра. */
export function buildDeckFromCore(core: string[], pool?: Set<string>): BuildResult {
  if (core.length !== 4 || new Set(core).size !== 4) {
    throw new Error("Нужно ровно 4 уникальные карты");
  }

  const allCards = getAllCards();
  const cardPool = pool ?? new Set(Object.keys(allCards));
  for (const c of core) cardPool.add(c);

  const archetype = detectArchetype(core);
  const ranked = rankSimilar(core, archetype, 8);
  const best = ranked[0];
  const coreSet = new Set(core);

  let deck: string[];
  let confidence = best?.confidence ?? 0;
  let sourceId: string | undefined;
  let sourceName: string | undefined;

  if (best && confidence >= MATCH_CONFIDENCE_THRESHOLD) {
    const fillers = best.record.cards.filter((c) => !coreSet.has(c)).slice(0, 4);
    deck = [...core, ...fillers];
    sourceId = best.record.id;
    sourceName = best.record.name;
  } else if (best && best.overlap >= 2) {
    const fillers = best.record.cards.filter((c) => !coreSet.has(c)).slice(0, 4);
    deck = [...core, ...fillers];
    sourceId = best.record.id;
    sourceName = best.record.name;
    confidence = Math.max(confidence, 60);
  } else {
    const fillers = best?.record.cards.filter((c) => !coreSet.has(c));
    deck = autoComplete([...core], core, cardPool, archetype, fillers);
  }

  if (deck.length < 8) deck = autoComplete(deck, core, cardPool, archetype);
  deck = replaceWeakFillers(deck, core, cardPool, archetype);
  if (balanceIssues(deck, archetype).length) {
    deck = autoComplete(deck, core, cardPool, archetype);
  }

  return {
    deck: deck.slice(0, 8),
    archetype,
    averageElixir: avgElixir(deck),
    synergyScore: deckSynergyScore(deck),
    confidence: Math.round(confidence * 10) / 10,
    sourceDeckId: sourceId,
    sourceDeckName: sourceName,
  };
}

/** Несколько вариантов для конструктора. */
export function buildMultipleDecks(core: string[], limit = 6): BuildResult[] {
  const archetype = detectArchetype(core);
  const ranked = rankSimilar(core, archetype, limit * 2);
  const allCards = getAllCards();
  const pool = new Set(Object.keys(allCards));
  for (const c of core) pool.add(c);

  const results: BuildResult[] = [];
  const seen = new Set<string>();
  const coreSet = new Set(core);

  for (const sd of ranked) {
    if (results.length >= limit) break;
    let fillers = sd.record.cards.filter((c) => !coreSet.has(c)).slice(0, 4);
    let deck = [...core, ...fillers];
    if (deck.length < 8) deck = autoComplete(deck, core, pool, sd.record.archetype, fillers);
    deck = replaceWeakFillers(deck, core, pool, sd.record.archetype);
    const key = [...deck].sort().join("|");
    if (seen.has(key) || deck.length !== 8) continue;
    seen.add(key);

    results.push({
      deck,
      archetype: sd.record.archetype,
      averageElixir: avgElixir(deck),
      synergyScore: deckSynergyScore(deck),
      confidence: Math.round(sd.confidence * 10) / 10,
      sourceDeckId: sd.record.id,
      sourceDeckName: sd.record.name,
    });
  }

  if (!results.length) results.push(buildDeckFromCore(core, pool));
  return results.slice(0, limit);
}

export { detectArchetype, rankSimilar, balanceIssues };
