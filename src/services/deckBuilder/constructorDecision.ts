/**
 * Слой решений конструктора: DeckIntent → GamePlan → bias шаблонов.
 * Зеркало bot/services/deck_builder/constructor_decision.py + deck_game_plan.py.
 * Не заменяет finalize — только порядок и приоритет выбора.
 */

import { KNOWN_SYNERGY, SYNERGY_PARTIAL, WIN_CONDITIONS } from "./constants";
import { cardHasRole, getCardMeta } from "./database";
import { DeckIntentEngine, type DeckIntent } from "./deckIntent";
import { pairSynergy } from "./synergy";
import type { DeckRecord } from "./types";

/** GamePlan для конструктора (без UI) — зеркало BE GamePlan. */
export interface ConstructorGamePlan {
  howToWin: string;
  primaryThreat: string;
  whenToAttack: string;
  keyCards: string[];
  coreCombinations: string[];
  criticalWeaknesses: string[];
}

export interface ConstructorDecision {
  archetype: string;
  intent: DeckIntent;
  gamePlan: ConstructorGamePlan;
}

const WIN_PLAN: Record<string, string> = {
  Cycle: "Давление дешёвой угрозой для башни через быстрый цикл и повторные атаки",
  "Log Bait": "Сплит-давление бочкой и bait-картами, вынуждая соперника тратить Бревно/малый спелл",
  "Fireball Bait": "Накопление ценности через bait и добивание большим спеллом",
  Beatdown: "Набор танка сзади и контрпуш с поддержкой после удачной защиты",
  Lava: "Воздушный пуш Лавовой гончей и Шаром с поддержкой спеллами",
  "Bridge Spam": "Агрессия на мосту несколькими угрозами, заставляя ошибаться в ответах",
  Siege: "Контроль зданиями и набор урона осадной картой при минусе оппонента",
  Control: "Выматывание обменами и точечный урон при преимуществе в эликсире",
  Graveyard: "Защита → накопление → Кладбище на танк/спелл-связку",
  "Royal Giant": "Давление Королевским гигантом на мосту при поддержке и контроле зданиями",
  "Split Lane": "Одновременное давление на две линии дешёвыми угрозами",
  Meta: "Гибкая игра от сильных обменов и давления основной угрозой",
};

const ATTACK_TIMING: Record<string, string> = {
  "Быстрый цикл": "Сразу после выгодного обмена или когда главная угроза снова в руке",
  "Сплит-пуш": "Когда у соперника нет малого спелла / Бревна или он потрачен на bait",
  Контрпуш: "Только после успешной защиты, превращая оставшиеся войска в пуш",
  Агрессивная: "С первых секунд и при любом плюсе эликсира",
  Осадная: "Когда оппонент в минусе по эликсиру или контр-пуш отбит зданием",
  Контроль: "В двойном эликсире и при явном плюсе после защиты",
  Оборонительная: "После стопа пуша — угроза на мост с поддержкой",
  Гибридная: "По ситуации: давление при плюсе, иначе набор через защиту",
};

function isCycleCard(name: string): boolean {
  return cardHasRole(name, "cycle") || (getCardMeta(name)?.elixir ?? 4) <= 2;
}

/** Зеркало BE build_game_plan для core/колоды конструктора. */
function buildConstructorGamePlan(
  cards: string[],
  archetype: string,
  intent: DeckIntent,
): ConstructorGamePlan {
  const primary =
    intent.primaryWin ??
    cards.find((c) => WIN_CONDITIONS.has(c) || cardHasRole(c, "win_condition")) ??
    null;

  const keyCards: string[] = [];
  if (primary && cards.includes(primary)) keyCards.push(primary);
  const scored = cards
    .filter((c) => c !== primary)
    .map((c) => {
      let s = primary ? pairSynergy(c, primary) : 0;
      if (cardHasRole(c, "big_spell") || cardHasRole(c, "small_spell")) s += 12;
      if (intent.requireBuilding && cardHasRole(c, "building")) s += 18;
      if (intent.minCycleCards > 0 && isCycleCard(c)) s += 10;
      if (cardHasRole(c, "support") || cardHasRole(c, "dps") || cardHasRole(c, "mini_tank")) {
        s += 8;
      }
      if (cardHasRole(c, "tank")) s += 10;
      return { c, s };
    })
    .sort((a, b) => b.s - a.s);
  for (const { c } of scored) {
    if (keyCards.length >= 5) break;
    if (!keyCards.includes(c)) keyCards.push(c);
  }

  const combos: { text: string; score: number }[] = [];
  const set = new Set(cards);
  for (const [key, score] of Object.entries(KNOWN_SYNERGY)) {
    const [a, b] = key.split("|");
    if (set.has(a) && set.has(b) && score >= SYNERGY_PARTIAL) {
      combos.push({ text: `${a} + ${b}`, score });
    }
  }
  if (primary) {
    for (const c of cards) {
      if (c === primary) continue;
      const s = pairSynergy(primary, c);
      if (s >= SYNERGY_PARTIAL) {
        const text = `${primary} + ${c}`;
        if (!combos.some((x) => x.text === text || x.text === `${c} + ${primary}`)) {
          combos.push({ text, score: s });
        }
      }
    }
  }
  combos.sort((a, b) => b.score - a.score);

  const weaknesses: string[] = [];
  const airN = cards.filter((c) => cardHasRole(c, "air_defense")).length;
  if (intent.minAirDefense > 0 && airN < intent.minAirDefense) {
    weaknesses.push("критично уязвима к воздуху (Balloon / Lava)");
  }
  if (intent.requireBuilding && !cards.some((c) => cardHasRole(c, "building"))) {
    weaknesses.push("нет здания при осадном/контрольном плане");
  }
  if (intent.minCycleCards > 0) {
    const cycleN = cards.filter(isCycleCard).length;
    if (cycleN < intent.minCycleCards) {
      weaknesses.push("недостаточно карт цикла для стратегии");
    }
  }
  if (
    intent.requiredSoftChecks.has("anti_swarm") &&
    !cards.some((c) => cardHasRole(c, "splash") || cardHasRole(c, "anti_swarm"))
  ) {
    weaknesses.push("критично уязвима к спаму");
  }
  if (
    intent.requiredSoftChecks.has("anti_tank") &&
    !cards.some((c) => cardHasRole(c, "anti_tank"))
  ) {
    weaknesses.push("критично уязвима к тяжёлым танкам");
  }
  if (
    intent.requiredSoftChecks.has("big_spell") &&
    !cards.some((c) => cardHasRole(c, "big_spell"))
  ) {
    weaknesses.push("нет большого заклинания для добивания / защиты");
  }

  let how = WIN_PLAN[archetype] ?? WIN_PLAN.Meta;
  if (primary) {
    how = `${how}. Основной инструмент — ${primary} (${intent.playStyle.toLowerCase()} стиль)`;
  }

  const threat = primary
    ? `${primary} — главная угроза башне и ось давления архетипа ${archetype}`
    : "Нет явной главной угрозы для башни — давление размыто";

  let when = ATTACK_TIMING[intent.playStyle] ?? ATTACK_TIMING.Гибридная;
  if (intent.minCycleCards >= 2) {
    when = `${when}. Цикл важен — атаковать при возврате главной угрозы в руку`;
  } else if (intent.attackBias >= 0.7) {
    when = `${when}. Высокий attack bias — держать постоянное давление`;
  }

  return {
    howToWin: how,
    primaryThreat: threat,
    whenToAttack: when,
    keyCards: keyCards.slice(0, 5),
    coreCombinations: combos.slice(0, 4).map((c) => c.text),
    criticalWeaknesses: weaknesses.slice(0, 5),
  };
}

export function prepareConstructorDecision(
  core: string[],
  detectArchetype: (cards: string[]) => string,
): ConstructorDecision {
  const detected = detectArchetype(core);
  const intent = DeckIntentEngine.infer(core, detected);
  const archetype = intent.archetype;
  const gamePlan = buildConstructorGamePlan(core, archetype, intent);
  return { archetype, intent, gamePlan };
}

export function templateDecisionBonus(
  record: DeckRecord,
  decision: ConstructorDecision,
): number {
  let bonus = 0;
  const cards = new Set(record.cards);
  const { intent, gamePlan, archetype } = decision;

  if (record.archetype === archetype) bonus += 10;
  if (intent.primaryWin && cards.has(intent.primaryWin)) bonus += 12;

  let keyHits = 0;
  for (const k of gamePlan.keyCards) if (cards.has(k)) keyHits += 1;
  bonus += Math.min(14, keyHits * 3.5);

  for (const combo of gamePlan.coreCombinations.slice(0, 3)) {
    const parts = combo.split("+").map((p) => p.trim());
    if (parts.length === 2 && cards.has(parts[0]) && cards.has(parts[1])) {
      bonus += 4;
    }
  }

  if (intent.requireBuilding) {
    const hasBuilding = record.cards.some((c) => cardHasRole(c, "building"));
    bonus += hasBuilding ? 5 : -6;
  }

  if (intent.minCycleCards > 0) {
    const cycleN = record.cards.filter(isCycleCard).length;
    if (cycleN >= intent.minCycleCards) bonus += 4;
  }

  if (intent.minAirDefense > 0) {
    const airN = record.cards.filter((c) => cardHasRole(c, "air_defense")).length;
    if (airN >= intent.minAirDefense) bonus += 3;
  }

  return bonus;
}

export function resultDecisionBonus(deck: string[], decision: ConstructorDecision): number {
  let bonus = 0;
  const cards = new Set(deck);
  const { intent, gamePlan } = decision;

  if (intent.primaryWin && cards.has(intent.primaryWin)) bonus += 8;

  let keyHits = 0;
  for (const k of gamePlan.keyCards) if (cards.has(k)) keyHits += 1;
  bonus += Math.min(10, keyHits * 2);

  for (const combo of gamePlan.coreCombinations.slice(0, 3)) {
    const parts = combo.split("+").map((p) => p.trim());
    if (parts.length === 2 && cards.has(parts[0]) && cards.has(parts[1])) {
      bonus += 3;
    }
  }

  if (intent.requireBuilding && !deck.some((c) => cardHasRole(c, "building"))) {
    bonus -= 8;
  }

  return bonus;
}
