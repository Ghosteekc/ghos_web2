import {
  ARCHETYPE_ANCHORS,
  ARCHETYPE_ELIXIR,
  ARCHETYPE_PRIMARY_WIN,
  DEFAULT_ELIXIR_MAX,
  DEFAULT_ELIXIR_MIN,
  GENERIC_CARDS,
  MAX_SPELLS,
  MAX_WINS,
  WIN_CONDITIONS,
  countIndependentWins,
  isTowerThreat,
} from "./constants";
import { avgElixir, cardHasRole, getCardMeta } from "./database";
import { DeckIntentEngine } from "./deckIntent";
import { deckSynergyScore, pairSynergy } from "./synergy";
import type { DeckRecord, ScoreBreakdown } from "./types";

export function isSpellCard(name: string): boolean {
  return cardHasRole(name, "spell");
}

/** Primary или secondary pressure — карта может вести план атаки. */
export function isAttackWin(name: string): boolean {
  return isTowerThreat(name);
}

export function isWinCard(name: string): boolean {
  return isAttackWin(name) || cardHasRole(name, "win_condition");
}

export function countSpells(deck: string[]): number {
  return deck.filter(isSpellCard).length;
}

export function countWins(deck: string[]): number {
  return countIndependentWins(deck);
}

export function meaningfulOverlap(core: string[], templateCards: string[]): string[] {
  const coreSet = new Set(core);
  return templateCards.filter((c) => coreSet.has(c) && !GENERIC_CARDS.has(c));
}

export function templateIsUsable(core: string[], template: DeckRecord): boolean {
  const coreSet = new Set(core);
  const meaningful = meaningfulOverlap(core, template.cards);
  if (meaningful.length >= 2) return true;
  if (coreSet.size === new Set([...coreSet, ...template.cards]).size - (8 - core.length)) {
    return true;
  }

  const primary = ARCHETYPE_PRIMARY_WIN[template.archetype] ?? [];
  const hasPrimary = primary.some((w) => coreSet.has(w));
  if (hasPrimary && meaningful.length >= 1) return true;

  const templateWins = template.cards.filter((c) => WIN_CONDITIONS.has(c));
  const coreWins = core.filter((c) => WIN_CONDITIONS.has(c));
  if (coreWins.length > 0 && meaningful.length >= 1) return true;

  if (templateWins.length > 0 && !templateWins.some((w) => coreSet.has(w))) {
    return false;
  }

  return meaningful.length >= 1;
}

function elixirBounds(archetype: string): [number, number] {
  return ARCHETYPE_ELIXIR[archetype] ?? [DEFAULT_ELIXIR_MIN, DEFAULT_ELIXIR_MAX];
}

function hasRole(deck: string[], role: string): boolean {
  return deck.some((c) => cardHasRole(c, role));
}

function countRole(deck: string[], role: string): number {
  return deck.filter((c) => cardHasRole(c, role)).length;
}

const SOFT_ROLE_BONUS: Record<string, number> = {
  big_spell: 12,
  small_spell: 10,
  air_defense: 8,
  anti_tank: 7,
  defensive: 7,
  anti_swarm: 6,
  mini_tank: 5,
  building: 4,
  dps: 3,
  counterpush: 3,
  cycle: 5,
};

const SCORE_WEIGHTS: Record<string, number> = {
  synergy: 0.25,
  offense: 0.12,
  defense: 0.12,
  anti_air: 0.12,
  anti_swarm: 0.1,
  spell_balance: 0.1,
  elixir: 0.1,
  archetype_fit: 0.09,
};

export function hardConstraintIssues(deck: string[], core: string[] = []): string[] {
  const issues: string[] = [];
  if (deck.length !== 8) issues.push("deck_size");
  if (new Set(deck).size !== deck.length) issues.push("duplicate_cards");
  if (core.length && !core.every((c) => deck.includes(c))) issues.push("missing_core");
  if (!deck.some((c) => isAttackWin(c))) issues.push("win_condition");
  if (countWins(deck) > MAX_WINS) issues.push("too_many_wins");
  if (countSpells(deck) > MAX_SPELLS) issues.push("too_many_spells");
  return issues;
}

export function softBalanceIssues(deck: string[], archetype: string): string[] {
  /** Soft-пробелы относительно DeckIntent (не универсальный чек-лист). */
  const intent = DeckIntentEngine.infer(deck, archetype);
  const required = intent.requiredSoftChecks;
  const [lo, hi] = elixirBounds(archetype);
  const issues: string[] = [];
  const avg = avgElixir(deck);

  if (required.has("big_spell") && !hasRole(deck, "big_spell")) issues.push("big_spell");
  if (required.has("small_spell") && !hasRole(deck, "small_spell")) issues.push("small_spell");
  if (required.has("air_defense")) {
    const airN = countRole(deck, "air_defense");
    if (airN < Math.max(1, intent.minAirDefense)) issues.push("air_defense");
  }
  if (required.has("anti_tank") && !hasRole(deck, "anti_tank")) issues.push("anti_tank");
  if (
    required.has("anti_swarm") &&
    !hasRole(deck, "anti_swarm") &&
    !hasRole(deck, "splash")
  ) {
    issues.push("anti_swarm");
  }
  if (required.has("building") && !hasRole(deck, "building")) issues.push("building");
  if (required.has("cycle")) {
    const cycleN = countRole(deck, "cycle");
    const cheap = deck.filter((c) => (getCardMeta(c)?.elixir ?? 4) <= 2).length;
    if (Math.max(cycleN, cheap) < intent.minCycleCards) issues.push("cycle");
  }
  if (avg < lo - 0.4 || avg > hi + 0.4) issues.push("elixir");

  return issues;
}

export function balanceIssues(deck: string[], archetype: string): string[] {
  return [...hardConstraintIssues(deck), ...softBalanceIssues(deck, archetype)];
}

function coreSynergyAvg(deck: string[], core: string[]): number {
  if (!core.length) return 0;
  let total = 0;
  let n = 0;
  for (const c of core) {
    for (const d of deck) {
      if (c !== d) {
        total += pairSynergy(c, d);
        n += 1;
      }
    }
  }
  return n ? total / n : 0;
}

function axisSynergy(deck: string[], core: string[]): number {
  const deckScore = deckSynergyScore(deck);
  const coreAvg = coreSynergyAvg(deck, core);
  return Math.min(100, Math.max(0, deckScore * 0.55 + coreAvg * 0.45));
}

function axisOffense(deck: string[]): number {
  let score = 0;
  if (deck.some(isAttackWin)) score += 40;
  if (hasRole(deck, "dps")) score += 20;
  if (hasRole(deck, "counterpush")) score += 15;
  if (hasRole(deck, "tank")) score += 15;
  if (countWins(deck) > 1) score -= 15;
  return Math.min(100, Math.max(0, score));
}

function axisDefense(deck: string[]): number {
  let score = 0;
  if (hasRole(deck, "defensive")) score += 35;
  if (hasRole(deck, "mini_tank")) score += 30;
  if (hasRole(deck, "building")) score += 25;
  if (hasRole(deck, "anti_tank")) score += 10;
  return Math.min(100, Math.max(0, score));
}

function axisAntiAir(deck: string[]): number {
  const n = countRole(deck, "air_defense");
  if (n >= 2) return n === 2 ? 100 : 90;
  if (n === 1) return 55;
  return 15;
}

function axisAntiSwarm(deck: string[]): number {
  if (hasRole(deck, "anti_swarm")) return 100;
  if (hasRole(deck, "splash")) return 60;
  return 25;
}

function axisSpellBalance(deck: string[]): number {
  const spells = countSpells(deck);
  const hasBig = hasRole(deck, "big_spell");
  const hasSmall = hasRole(deck, "small_spell");
  let base = 45;
  if (hasBig && hasSmall) base = 100;
  else if (hasBig) base = 65;
  else if (hasSmall) base = 70;
  else if (spells === 0) base = 20;
  if (spells > MAX_SPELLS) base = 10;
  return base;
}

function axisElixir(deck: string[], archetype: string): number {
  const [lo, hi] = elixirBounds(archetype);
  const avg = avgElixir(deck);
  if (avg >= lo && avg <= hi) return 100;
  const diff = Math.max(lo - avg, avg - hi, 0);
  if (diff <= 0.4) return Math.max(50, 100 - diff * 125);
  return Math.max(15, 50 - (diff - 0.4) * 80);
}

function axisArchetypeFit(deck: string[], archetype: string): number {
  const anchors = ARCHETYPE_ANCHORS[archetype] ?? new Set<string>();
  const deckSet = new Set(deck);
  let anchorHits = 0;
  for (const a of anchors) if (deckSet.has(a)) anchorHits += 1;
  let score = anchors.size ? (anchorHits / anchors.size) * 80 : 50;
  const primary = ARCHETYPE_PRIMARY_WIN[archetype] ?? [];
  if (primary.some((w) => deckSet.has(w))) score += 20;
  return Math.min(100, Math.max(0, score));
}

export function computeScoreBreakdown(
  deck: string[],
  core: string[],
  archetype: string,
): ScoreBreakdown {
  const hard = hardConstraintIssues(deck, core);
  const soft = softBalanceIssues(deck, archetype);
  const axes = {
    synergy: axisSynergy(deck, core),
    offense: axisOffense(deck),
    defense: axisDefense(deck),
    anti_air: axisAntiAir(deck),
    anti_swarm: axisAntiSwarm(deck),
    spell_balance: axisSpellBalance(deck),
    elixir: axisElixir(deck, archetype),
    archetype_fit: axisArchetypeFit(deck, archetype),
  };
  const total = Object.entries(axes).reduce(
    (sum, [key, value]) => sum + value * (SCORE_WEIGHTS[key] ?? 0),
    0,
  );
  return {
    synergy: axes.synergy,
    offense: axes.offense,
    defense: axes.defense,
    anti_air: axes.anti_air,
    anti_swarm: axes.anti_swarm,
    spell_balance: axes.spell_balance,
    elixir: axes.elixir,
    archetype_fit: axes.archetype_fit,
    total,
    hard_issues: hard,
    soft_issues: soft,
  };
}

export function isPlayableBalanced(
  breakdown: ScoreBreakdown,
  coreSynergy: number,
  minCoreSynergy = 62,
  minTotal = 58,
): boolean {
  if (breakdown.hard_issues.length) return false;
  if (coreSynergy < minCoreSynergy) return false;
  return breakdown.total >= minTotal;
}

function issueToRole(issue: string): string | undefined {
  const map: Record<string, string> = {
    big_spell: "big_spell",
    small_spell: "small_spell",
    air_defense: "air_defense",
    anti_tank: "anti_tank",
    anti_swarm: "anti_swarm",
    building: "building",
    cycle: "cycle",
  };
  return map[issue];
}

function softRoleBonusForCard(card: string, missingIssues: Set<string>): number {
  let bonus = 0;
  for (const issue of missingIssues) {
    if (issue === "anti_swarm") {
      if (cardHasRole(card, "anti_swarm") || cardHasRole(card, "splash")) {
        bonus += SOFT_ROLE_BONUS.anti_swarm ?? 4;
      }
      continue;
    }
    const role = issueToRole(issue);
    if (role && cardHasRole(card, role)) bonus += SOFT_ROLE_BONUS[role] ?? 4;
  }
  return bonus;
}

function fillerCandidateScore(
  card: string,
  deck: string[],
  core: string[],
  archetype: string,
  missingIssues: Set<string>,
): number {
  const synWithDeck = deck.reduce((s, x) => s + pairSynergy(card, x), 0) / Math.max(deck.length, 1);
  const synWithCore = core.reduce((s, c) => s + pairSynergy(card, c), 0) / Math.max(core.length, 1);
  const roleBonus = softRoleBonusForCard(card, missingIssues);
  const [lo, hi] = elixirBounds(archetype);
  const mid = (lo + hi) / 2;
  const elixirPenalty = Math.abs(avgElixir([...deck, card]) - mid) * 3;
  const genericPenalty = GENERIC_CARDS.has(card) ? 4 : 0;
  return synWithDeck * 0.45 + synWithCore * 0.35 + roleBonus * 2.5 - elixirPenalty - genericPenalty;
}

function pickBestFiller(
  deck: string[],
  core: string[],
  pool: Set<string>,
  archetype: string,
  options: { allowSpells?: boolean; allowWins?: boolean } = {},
): string | undefined {
  const { allowSpells = true, allowWins = true } = options;
  const missing = new Set(softBalanceIssues(deck, archetype));
  const candidates = [...pool].filter((c) => {
    if (deck.includes(c)) return false;
    if (!allowSpells && isSpellCard(c)) return false;
    if (!allowWins && isAttackWin(c)) return false;
    return true;
  });
  if (!candidates.length) return undefined;

  let best: string | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const card of candidates) {
    if (isSpellCard(card) && countSpells(deck) >= MAX_SPELLS) continue;
    if (isAttackWin(card) && countWins(deck) >= MAX_WINS) continue;
    const score = fillerCandidateScore(card, deck, core, archetype, missing);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}

function replaceWeakestFiller(deck: string[], core: string[], replacement: string): string[] {
  const coreSet = new Set(core);
  let fillers = deck.filter((c) => !coreSet.has(c) && !isAttackWin(c));
  if (!fillers.length) fillers = deck.filter((c) => !coreSet.has(c));
  if (!fillers.length || deck.includes(replacement)) return deck;
  const worst = fillers.sort(
    (a, b) =>
      deck.reduce((s, x) => s + pairSynergy(a, x), 0) -
      deck.reduce((s, x) => s + pairSynergy(b, x), 0),
  )[0];
  return deck.map((c) => (c === worst ? replacement : c));
}

function pickWinForArchetype(
  deck: string[],
  core: string[],
  pool: Set<string>,
  archetype: string,
): string | undefined {
  const preferred = (ARCHETYPE_PRIMARY_WIN[archetype] ?? []).filter(isAttackWin);
  for (const win of preferred) {
    if (pool.has(win) && !deck.includes(win)) return win;
  }
  const candidates = [...pool].filter(
    (c) => !deck.includes(c) && isAttackWin(c) && !isSpellCard(c),
  );
  if (!candidates.length) {
    const fallback = preferred.length
      ? preferred
      : ["Hog Rider", "Miner", "Battle Ram", "Royal Giant", "Goblin Barrel", "Wall Breakers"];
    return fallback.find((w) => !deck.includes(w));
  }
  return candidates.sort(
    (a, b) =>
      core.reduce((s, x) => s + pairSynergy(b, x), 0) * 3 +
      deck.reduce((s, x) => s + pairSynergy(b, x), 0) -
      (core.reduce((s, x) => s + pairSynergy(a, x), 0) * 3 +
        deck.reduce((s, x) => s + pairSynergy(a, x), 0)),
  )[0];
}

function trimExcessSpells(deck: string[], core: string[]): string[] {
  let out = [...deck];
  const coreSet = new Set(core);
  while (countSpells(out) > MAX_SPELLS) {
    const removable = out.filter((c) => isSpellCard(c) && !coreSet.has(c));
    if (!removable.length) break;
    const hasBig = out.some((c) => cardHasRole(c, "big_spell"));
    const hasSmall = out.some((c) => cardHasRole(c, "small_spell"));
    const sorted = removable.sort((a, b) => {
      const aBig = cardHasRole(a, "big_spell") ? 1 : 0;
      const bBig = cardHasRole(b, "big_spell") ? 1 : 0;
      const aSmall = cardHasRole(a, "small_spell") ? 1 : 0;
      const bSmall = cardHasRole(b, "small_spell") ? 1 : 0;
      if (hasBig && hasSmall) {
        return (
          out.reduce((s, x) => s + pairSynergy(a, x), 0) -
          out.reduce((s, x) => s + pairSynergy(b, x), 0)
        );
      }
      if (hasBig && aBig && !hasSmall) return 1;
      if (hasSmall && aSmall && !hasBig) return 1;
      return (
        out.reduce((s, x) => s + pairSynergy(a, x), 0) -
        out.reduce((s, x) => s + pairSynergy(b, x), 0)
      );
    });
    const drop = sorted[0];
    out = out.filter((c, i) => !(c === drop && i === out.indexOf(drop)));
  }
  return out;
}

function trimExcessWins(deck: string[], core: string[]): string[] {
  let out = [...deck];
  const coreSet = new Set(core);
  while (countWins(out) > MAX_WINS) {
    const extra = out.filter((c) => isAttackWin(c) && !coreSet.has(c));
    if (!extra.length) break;
    const drop = extra[0];
    out = out.filter((c, i) => !(c === drop && i === out.indexOf(drop)));
  }
  return out;
}

/** Финализация: жёсткие правила + добор по score (мягкий баланс). */
export function finalizeDeck(
  deck: string[],
  core: string[],
  pool: Set<string>,
  archetype: string,
): string[] {
  const coreSet = new Set(core);
  let out = [...new Set([...core, ...deck.filter((c) => !coreSet.has(c))])];

  out = trimExcessSpells(out, core);
  out = trimExcessWins(out, core);

  const ensureAttackWin = () => {
    if (out.some(isAttackWin)) return;
    const win = pickWinForArchetype(out, core, pool, archetype);
    if (!win) return;
    if (out.length >= 8) out = replaceWeakestFiller(out, core, win);
    else out.push(win);
  };

  ensureAttackWin();

  while (out.length < 8) {
    const pick = pickBestFiller(out, core, pool, archetype);
    if (!pick) break;
    out.push(pick);
  }

  out = trimExcessSpells(out, core);
  out = trimExcessWins(out, core);
  ensureAttackWin();

  while (out.length > 8) {
    let droppable = out.filter((c) => !coreSet.has(c) && !isAttackWin(c));
    if (!droppable.length) droppable = out.filter((c) => !coreSet.has(c));
    if (!droppable.length) break;
    const drop = droppable.sort(
      (a, b) =>
        out.reduce((s, x) => s + pairSynergy(a, x), 0) -
        out.reduce((s, x) => s + pairSynergy(b, x), 0),
    )[0];
    out = out.filter((c, i) => !(c === drop && i === out.indexOf(drop)));
  }

  while (out.length < 8) {
    const pick = pickBestFiller(out, core, pool, archetype, {
      allowSpells: countSpells(out) < MAX_SPELLS,
      allowWins: countWins(out) < MAX_WINS,
    });
    if (!pick) {
      const extra = [...pool].find((c) => !out.includes(c));
      if (!extra) break;
      out.push(extra);
    } else {
      out.push(pick);
    }
  }

  ensureAttackWin();
  return out.slice(0, 8);
}

export function fillersFromTemplate(
  core: string[],
  template: DeckRecord,
): string[] {
  const coreSet = new Set(core);
  const coreHasWin = core.some((c) => WIN_CONDITIONS.has(c));

  const wins = template.cards.filter(
    (c) => !coreSet.has(c) && WIN_CONDITIONS.has(c),
  );
  const troops = template.cards.filter(
    (c) =>
      !coreSet.has(c) &&
      !WIN_CONDITIONS.has(c) &&
      !isSpellCard(c) &&
      !GENERIC_CARDS.has(c),
  );
  const spells = template.cards.filter(
    (c) => !coreSet.has(c) && isSpellCard(c) && !GENERIC_CARDS.has(c),
  );
  const generic = template.cards.filter(
    (c) => !coreSet.has(c) && GENERIC_CARDS.has(c),
  );

  const ordered = [
    ...(coreHasWin ? [] : wins.slice(0, 1)),
    ...troops,
    ...spells,
    ...generic,
  ];
  return ordered.slice(0, 4);
}
