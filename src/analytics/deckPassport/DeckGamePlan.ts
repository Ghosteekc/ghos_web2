/**
 * Внутренний GamePlan колоды — для анализа и рекомендаций.
 * Не предназначен для отображения пользователю.
 */

import { KNOWN_SYNERGY, SYNERGY_PARTIAL, WIN_CONDITIONS } from "@/services/deckBuilder/constants";
import { cardHasRole, getCardMeta } from "@/services/deckBuilder/database";
import { pairSynergy } from "@/services/deckBuilder/synergy";
import type { DeckIntent } from "@/services/deckBuilder/deckIntent";
import type { PlayStyle } from "./DeckArchetypes";
import type { DeckMetrics } from "./DeckRating";

export interface DeckGamePlan {
  /** Как выигрывает колода */
  howToWin: string;
  /** Основная угроза / давление */
  primaryThreat: string;
  /** Когда нужно атаковать */
  whenToAttack: string;
  /** Ключевые карты */
  keyCards: string[];
  /** Основные комбинации (пары/тройки текстом) */
  coreCombinations: string[];
  /** Наиболее опасные слабости */
  criticalWeaknesses: string[];
}

const WIN_PLAN: Record<string, string> = {
  Cycle: "Давление дешёвой угрозой для башни через быстрый цикл и повторные атаки",
  "Log Bait": "Сплит-давление бочкой и bait-картами, вынуждая соперника тратить Бревно/малый спелл",
  "Fireball Bait": "Накопление ценности через bait и добивание большим спеллом",
  Beatdown: "Набор танка сзади и контрпуш с поддержкой после удачной защиты",
  Lava: "Воздушный пуш Лавовой гончей и Шаром с поддержкой спеллами",
  "Bridge Spam": "Агрессия на мосту несколькими угрозами, заставляя ошибаться в ответах",
  Siege: "Контроль зданиями и набор урона осадной картой, когда оппонент перерасходовал эликсир",
  Control: "Выматывание обменами и точечный урон Шахтёром/Буром при преимуществе в эликсире",
  Graveyard: "Защита → накопление → Кладбище на танк/спелл-связку",
  "Royal Giant": "Давление Королевским гигантом на мосту при поддержке и контроле зданиями",
  "Split Lane": "Одновременное давление на две линии дешёвыми угрозами",
  Meta: "Гибкая игра от сильных обменов и давления основной угрозой",
};

const ATTACK_TIMING: Record<string, string> = {
  "Быстрый цикл": "Сразу после выгодного обмена или когда главная угроза снова в руке — не держать эликсир",
  "Сплит-пуш": "Когда у соперника нет малого спелла / Бревна или он потрачен на bait",
  Контрпуш: "Только после успешной защиты, превращая оставшиеся войска в пуш",
  Агрессивная: "С первых секунд и при любом плюсе эликсира — держать инициативу",
  Осадная: "Когда оппонент в минусе по эликсиру или его контр-пуш отбит зданием",
  Контроль: "В двойном эликсире и при явном плюсе после защиты",
  Оборонительная: "После стопа пуша — RG/угроза на мост с поддержкой",
  Гибридная: "По ситуации: давление при плюсе, иначе набор через защиту",
};

function pickPrimaryWin(cardNames: string[], intent: DeckIntent): string | null {
  if (intent.primaryWin) return intent.primaryWin;
  const wins = cardNames.filter(
    (c) => WIN_CONDITIONS.has(c) || cardHasRole(c, "win_condition"),
  );
  return wins[0] ?? null;
}

function keyCardsForDeck(
  cardNames: string[],
  primaryWin: string | null,
  intent: DeckIntent,
): string[] {
  const keys: string[] = [];
  const push = (c: string | null | undefined) => {
    if (c && cardNames.includes(c) && !keys.includes(c)) keys.push(c);
  };

  push(primaryWin);

  // Поддержка win / спеллы / здания / цикл
  const scored = cardNames
    .filter((c) => c !== primaryWin)
    .map((c) => {
      let s = 0;
      if (primaryWin) s += pairSynergy(c, primaryWin);
      if (cardHasRole(c, "big_spell") || cardHasRole(c, "small_spell")) s += 12;
      if (intent.requireBuilding && cardHasRole(c, "building")) s += 18;
      if (intent.minCycleCards > 0 && (cardHasRole(c, "cycle") || (getCardMeta(c)?.elixir ?? 4) <= 2)) {
        s += 10;
      }
      if (cardHasRole(c, "support") || cardHasRole(c, "dps") || cardHasRole(c, "mini_tank")) s += 8;
      if (cardHasRole(c, "tank")) s += 10;
      return { c, s };
    })
    .sort((a, b) => b.s - a.s);

  for (const { c } of scored) {
    if (keys.length >= 5) break;
    push(c);
  }
  return keys.slice(0, 5);
}

function coreCombinations(cardNames: string[], primaryWin: string | null): string[] {
  const combos: { text: string; score: number }[] = [];
  const set = new Set(cardNames);

  for (const [key, score] of Object.entries(KNOWN_SYNERGY)) {
    const [a, b] = key.split("|");
    if (set.has(a) && set.has(b) && score >= SYNERGY_PARTIAL) {
      combos.push({ text: `${a} + ${b}`, score });
    }
  }

  // Динамические пары с primary win
  if (primaryWin) {
    for (const c of cardNames) {
      if (c === primaryWin) continue;
      const s = pairSynergy(primaryWin, c);
      if (s >= SYNERGY_PARTIAL) {
        const text = `${primaryWin} + ${c}`;
        if (!combos.some((x) => x.text === text || x.text === `${c} + ${primaryWin}`)) {
          combos.push({ text, score: s });
        }
      }
    }
  }

  combos.sort((a, b) => b.score - a.score);
  return combos.slice(0, 4).map((c) => c.text);
}

function howToWinText(
  archetype: string,
  primaryWin: string | null,
  playStyle: PlayStyle,
): string {
  const base = WIN_PLAN[archetype] ?? WIN_PLAN.Meta;
  if (!primaryWin) return base;
  return `${base}. Основной инструмент — ${primaryWin} (${playStyle.toLowerCase()} стиль)`;
}

function primaryThreatText(primaryWin: string | null, cardNames: string[], archetype: string): string {
  if (primaryWin) {
    return `${primaryWin} — главная угроза башне и ось давления архетипа ${archetype}`;
  }
  const tank = cardNames.find((c) => cardHasRole(c, "tank"));
  if (tank) return `${tank} — танковый фронт и основа пуша`;
  const dps = cardNames.find((c) => cardHasRole(c, "dps") || cardHasRole(c, "support"));
  if (dps) return `${dps} — ключевой урон / поддержка`;
  return "Нет явной главной угрозы для башни — давление размыто";
}

function whenToAttackText(
  playStyle: PlayStyle,
  intent: DeckIntent,
  metrics: DeckMetrics,
): string {
  const base = ATTACK_TIMING[playStyle] ?? ATTACK_TIMING.Гибридная;
  if (intent.minCycleCards >= 2 && metrics.cycleSpeed >= 7) {
    return `${base}. Цикл быстрый — атаковать при каждом возврате win в руку`;
  }
  if (metrics.defense >= metrics.attack + 1.5) {
    return `${base}. Приоритет защиты: не форсировать пуш из минуса`;
  }
  if (intent.attackBias >= 0.7) {
    return `${base}. Высокий attack bias — держать постоянное давление`;
  }
  return base;
}

function criticalWeaknesses(
  weaknesses: string[],
  matchupWeak: string[],
  metrics: DeckMetrics,
  intent: DeckIntent,
): string[] {
  const out: string[] = [...weaknesses];

  for (const m of matchupWeak.slice(0, 2)) {
    const line = `плох матчап против ${m}`;
    if (!out.includes(line)) out.push(line);
  }

  if (metrics.antiAir < 4.5 && intent.minAirDefense > 0) {
    const line = "критично уязвима к воздуху (Balloon / Lava)";
    if (!out.includes(line)) out.push(line);
  }
  if (metrics.antiTank < 4.5 && intent.requiredSoftChecks.has("anti_tank")) {
    const line = "критично уязвима к тяжёлым танкам";
    if (!out.includes(line)) out.push(line);
  }
  if (metrics.swarmDefense < 4.5 && intent.requiredSoftChecks.has("anti_swarm")) {
    const line = "критично уязвима к спаму";
    if (!out.includes(line)) out.push(line);
  }

  return out.slice(0, 5);
}

export function buildGamePlan(input: {
  cardNames: string[];
  archetype: string;
  playStyle: PlayStyle;
  intent: DeckIntent;
  metrics: DeckMetrics;
  weaknesses: string[];
  matchupWeak: string[];
}): DeckGamePlan {
  const { cardNames, archetype, playStyle, intent, metrics, weaknesses, matchupWeak } = input;
  const primaryWin = pickPrimaryWin(cardNames, intent);

  return {
    howToWin: howToWinText(archetype, primaryWin, playStyle),
    primaryThreat: primaryThreatText(primaryWin, cardNames, archetype),
    whenToAttack: whenToAttackText(playStyle, intent, metrics),
    keyCards: keyCardsForDeck(cardNames, primaryWin, intent),
    coreCombinations: coreCombinations(cardNames, primaryWin),
    criticalWeaknesses: criticalWeaknesses(weaknesses, matchupWeak, metrics, intent),
  };
}
