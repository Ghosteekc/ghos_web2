import {
  ARCHETYPE_ELIXIR,
  ARCHETYPE_PRIMARY_WIN,
  DEFAULT_ELIXIR_MAX,
  DEFAULT_ELIXIR_MIN,
  FILL_PRIORITY,
  GENERIC_CARDS,
  MAX_SPELLS,
  MAX_WINS,
  WIN_CONDITIONS,
} from "./constants";
import { avgElixir, cardRoles, getAllCards } from "./database";
import { pairSynergy } from "./synergy";
import type { DeckRecord } from "./types";

export function isSpellCard(name: string): boolean {
  const roles = cardRoles(name);
  return roles.has("spell") || roles.has("small_spell") || roles.has("big_spell");
}

export function isWinCard(name: string): boolean {
  return WIN_CONDITIONS.has(name) || cardRoles(name).has("win_condition");
}

export function countSpells(deck: string[]): number {
  return deck.filter(isSpellCard).length;
}

export function countWins(deck: string[]): number {
  return deck.filter(isWinCard).length;
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
  return deck.some((c) => cardRoles(c).has(role));
}

function countRole(deck: string[], role: string): number {
  return deck.filter((c) => cardRoles(c).has(role)).length;
}

export function balanceIssues(deck: string[], archetype: string): string[] {
  const [lo, hi] = elixirBounds(archetype);
  const issues: string[] = [];
  const avg = avgElixir(deck);

  if (!deck.some((c) => isWinCard(c))) issues.push("win_condition");
  if (countWins(deck) > MAX_WINS) issues.push("too_many_wins");
  if (!hasRole(deck, "big_spell")) issues.push("big_spell");
  if (!hasRole(deck, "small_spell")) issues.push("small_spell");
  if (countSpells(deck) > MAX_SPELLS) issues.push("too_many_spells");
  if (countRole(deck, "air_defense") < 2) issues.push("air_defense");
  if (!hasRole(deck, "anti_tank")) issues.push("anti_tank");
  if (!hasRole(deck, "defensive")) issues.push("defensive");
  if (!hasRole(deck, "anti_swarm")) issues.push("anti_swarm");
  if (avg < lo - 0.4 || avg > hi + 0.4) issues.push("elixir");

  return issues;
}

function pickForRole(
  deck: string[],
  pool: Set<string>,
  role: string,
  archetype: string,
  excludeSpells = false,
): string | undefined {
  const [lo, hi] = elixirBounds(archetype);
  const mid = (lo + hi) / 2;
  const candidates = [...pool].filter((c) => {
    if (deck.includes(c)) return false;
    if (excludeSpells && isSpellCard(c)) return false;
    return cardRoles(c).has(role);
  });
  if (!candidates.length) return undefined;

  return candidates.sort((a, b) => {
    const synA = deck.reduce((s, x) => s + pairSynergy(a, x), 0) / deck.length;
    const synB = deck.reduce((s, x) => s + pairSynergy(b, x), 0) / deck.length;
    const elA = Math.abs(avgElixir([...deck, a]) - mid);
    const elB = Math.abs(avgElixir([...deck, b]) - mid);
    return synB - synA || elA - elB;
  })[0];
}

function pickWinForArchetype(
  deck: string[],
  pool: Set<string>,
  archetype: string,
): string | undefined {
  const preferred = ARCHETYPE_PRIMARY_WIN[archetype] ?? [];
  const coreSet = new Set(deck);
  for (const win of preferred) {
    if (pool.has(win) && !coreSet.has(win)) return win;
  }
  const candidates = [...pool].filter(
    (c) => !deck.includes(c) && WIN_CONDITIONS.has(c) && !isSpellCard(c),
  );
  if (!candidates.length) return undefined;
  return candidates.sort(
    (a, b) =>
      deck.reduce((s, x) => s + pairSynergy(b, x), 0) -
      deck.reduce((s, x) => s + pairSynergy(a, x), 0),
  )[0];
}

function replaceWeakestFiller(deck: string[], core: string[], replacement: string): string[] {
  const coreSet = new Set(core);
  const fillers = deck.filter((c) => !coreSet.has(c));
  if (!fillers.length) return deck;
  const worst = fillers.sort(
    (a, b) =>
      deck.reduce((s, x) => s + pairSynergy(a, x), 0) -
      deck.reduce((s, x) => s + pairSynergy(b, x), 0),
  )[0];
  return deck.map((c) => (c === worst ? replacement : c));
}

function trimExcessSpells(deck: string[], core: string[]): string[] {
  let out = [...deck];
  const coreSet = new Set(core);
  while (countSpells(out) > MAX_SPELLS) {
    const removable = out.filter((c) => isSpellCard(c) && !coreSet.has(c));
    if (!removable.length) break;
    const hasBig = out.some((c) => cardRoles(c).has("big_spell"));
    const hasSmall = out.some((c) => cardRoles(c).has("small_spell"));
    const sorted = removable.sort((a, b) => {
      const aBig = cardRoles(a).has("big_spell") ? 1 : 0;
      const bBig = cardRoles(b).has("big_spell") ? 1 : 0;
      const aSmall = cardRoles(a).has("small_spell") ? 1 : 0;
      const bSmall = cardRoles(b).has("small_spell") ? 1 : 0;
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
    const extra = out.filter((c) => isWinCard(c) && !coreSet.has(c));
    if (!extra.length) break;
    const drop = extra[0];
    out = out.filter((c, i) => !(c === drop && i === out.indexOf(drop)));
  }
  return out;
}

/** Жёсткая финализация: win, лимит спеллов, роли, 8 карт. */
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

  if (!out.some((c) => isWinCard(c))) {
    const win = pickWinForArchetype(out, pool, archetype);
    if (win) {
      if (out.length >= 8) out = replaceWeakestFiller(out, core, win);
      else out.push(win);
    }
  }

  let issues = balanceIssues(out, archetype);
  for (const role of FILL_PRIORITY) {
    while (out.length < 8 && issues.includes(role)) {
      const pick = pickForRole(
        out,
        pool,
        role,
        archetype,
        role !== "big_spell" && role !== "small_spell" && countSpells(out) >= MAX_SPELLS,
      );
      if (!pick) break;
      if (isSpellCard(pick) && countSpells(out) >= MAX_SPELLS) break;
      if (isWinCard(pick) && countWins(out) >= MAX_WINS) break;
      out.push(pick);
      issues = balanceIssues(out, archetype);
    }
  }

  const troops = [...pool]
    .filter((c) => !out.includes(c) && !isSpellCard(c))
    .sort(
      (a, b) =>
        out.reduce((s, x) => s + pairSynergy(b, x), 0) -
        out.reduce((s, x) => s + pairSynergy(a, x), 0),
    );
  for (const card of troops) {
    if (out.length >= 8) break;
    if (isWinCard(card) && countWins(out) >= MAX_WINS) continue;
    out.push(card);
  }

  out = trimExcessSpells(out, core);
  out = trimExcessWins(out, core);

  while (out.length > 8) {
    const droppable = out.filter((c) => !coreSet.has(c));
    if (!droppable.length) break;
    const drop = droppable.sort(
      (a, b) =>
        out.reduce((s, x) => s + pairSynergy(a, x), 0) -
        out.reduce((s, x) => s + pairSynergy(b, x), 0),
    )[0];
    out = out.filter((c, i) => !(c === drop && i === out.indexOf(drop)));
  }

  while (out.length < 8) {
    const extra = [...pool].find((c) => !out.includes(c) && !isSpellCard(c));
    if (!extra) break;
    out.push(extra);
  }

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
