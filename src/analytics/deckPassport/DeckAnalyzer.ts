import type { Deck, RecommendationResult } from "@/types";
import {
  detectDeckArchetype,
  detectPlayStyle,
  deckTypeLabel,
  type PlayStyle,
} from "./DeckArchetypes";
import { computeDifficulty, type DifficultyLevel } from "./DeckDifficulty";
import { getArchetypeMatchups } from "./DeckMatchups";
import { computePracticality } from "./DeckPracticality";
import {
  computeDeckMetrics,
  computeGhosteekScore,
  computeStars,
  type DeckMetrics,
} from "./DeckRating";
import { evaluateRoleBalance, type RoleBalanceEntry } from "./DeckRoles";
import { starsDisplay } from "./constants/ratings";
import { collectCardNames, computeBasicInfo, type DeckBasicInfo } from "./DeckStatistics";
import type { DeckGamePlan } from "./DeckGamePlan";

export interface DeckPassportResult {
  score: number;
  stars: number;
  starsDisplay: string;
  metrics: DeckMetrics;
  attack: number;
  defense: number;
  control: number;
  counterpush: number;
  cycleSpeed: number;
  antiAir: number;
  antiGround: number;
  antiTank: number;
  swarmDefense: number;
  versatility: number;
  stability: number;
  archetype: string;
  playStyle: PlayStyle;
  basicInfo: DeckBasicInfo;
  roleBalance: RoleBalanceEntry[];
  practicality: number;
  practicalityReasons: { positive: string[]; negative: string[] };
  difficulty: DifficultyLevel;
  strengths: string[];
  weaknesses: string[];
  matchups: { strong: string[]; weak: string[] };
  summary: string;
  /** Из RecommendationEngine (BE) */
  gamePlan: DeckGamePlan;
  improvements: { category: string; message: string; suggested_cards: string[] }[];
  riskScore: number;
  decisionExplanation: RecommendationResult["decision_explanation"] | null;
}

const METRIC_LABELS: { key: keyof DeckMetrics; label: string }[] = [
  { key: "attack", label: "Атака" },
  { key: "defense", label: "Защита" },
  { key: "control", label: "Контроль" },
  { key: "counterpush", label: "Контрпуш" },
  { key: "cycleSpeed", label: "Скорость цикла" },
  { key: "antiAir", label: "Защита воздуха" },
  { key: "antiGround", label: "Защита земли" },
  { key: "antiTank", label: "Против танков" },
  { key: "swarmDefense", label: "Против роя" },
  { key: "versatility", label: "Универсальность" },
  { key: "stability", label: "Стабильность" },
];

function buildStrengths(metrics: DeckMetrics, roleBalance: RoleBalanceEntry[]): string[] {
  const out: string[] = [];
  if (metrics.counterpush >= 7.5) out.push("сильный контрпуш");
  if (metrics.cycleSpeed >= 7.5) out.push("отличный цикл");
  if (metrics.antiTank >= 7) out.push("надёжная защита против танков");
  if (metrics.attack >= 7.5) out.push("высокий потенциал давления");
  if (metrics.defense >= 7.5) out.push("крепкая оборона");
  if (metrics.control >= 7) out.push("хороший контроль поля");
  if (metrics.antiAir >= 7) out.push("уверенная защита воздуха");
  if (roleBalance.length > 0 && roleBalance.every((r) => r.present)) {
    out.push("полный набор ролей");
  }
  return out.slice(0, 5);
}

/** Слабости / улучшения — только из RecommendationEngine (BE). */
function weaknessesFromRecommendation(rec: RecommendationResult): string[] {
  // Builder без критических замен: не показываем soft-претензии как опровержение сборки.
  if (rec.origin === "builder" && !rec.improvement_plan.needed) {
    return [];
  }
  const out: string[] = [];
  for (const msg of rec.balance_issues.messages) {
    if (!out.includes(msg)) out.push(msg);
  }
  for (const step of rec.improvement_plan.steps) {
    if (!out.includes(step.message)) out.push(step.message);
  }
  for (const f of rec.risk_assessment.factors) {
    if (!out.includes(f)) out.push(f);
  }
  return out.slice(0, 6);
}

function gamePlanFromRecommendation(rec: RecommendationResult): DeckGamePlan {
  const gp = rec.game_plan;
  return {
    howToWin: gp.how_to_win,
    primaryThreat: gp.primary_threat,
    whenToAttack: gp.when_to_attack,
    keyCards: gp.key_cards,
    coreCombinations: gp.core_combinations,
    criticalWeaknesses: gp.critical_weaknesses,
  };
}

function buildSummary(
  score: number,
  archetype: string,
  playStyle: PlayStyle,
  strengths: string[],
  matchups: { strong: string[]; weak: string[] },
  metrics: DeckMetrics,
): string {
  const parts: string[] = [];

  if (score >= 75) {
    parts.push("Эта колода отлично подходит для рейтинговых боёв.");
  } else if (score >= 55) {
    parts.push("Колода имеет потенциал в рейтинге при грамотной игре.");
  } else {
    parts.push("Колода требует доработки состава или высокого мастерства.");
  }

  if (metrics.attack >= 7 && metrics.defense >= 7) {
    parts.push("Имеет хороший баланс атаки и защиты.");
  } else if (metrics.attack >= metrics.defense + 2) {
    parts.push("Ориентирована на постоянное давление.");
  } else if (metrics.defense >= metrics.attack + 2) {
    parts.push("Строится вокруг надёжной обороны.");
  }

  if (matchups.strong.length > 0) {
    parts.push(`Лучше всего показывает себя против ${matchups.strong.slice(0, 2).join(" и ")}.`);
  }

  if (playStyle === "Контрпуш" || playStyle === "Оборонительная") {
    parts.push("Основой игры является защита с последующим контрпушем.");
  } else if (playStyle === "Быстрый цикл") {
    parts.push("Ключ к успеху — быстрый цикл и постоянный давление.");
  } else if (playStyle === "Агрессивная") {
    parts.push("Требует активной игры и инициативы с первых секунд.");
  }

  if (strengths.length === 0) {
    parts.push(`Архетип ${archetype} — универсальный, но требует практики.`);
  }

  return parts.join(" ");
}

/**
 * Presentation-метрики локально; рекомендации состава — только из BE RecommendationEngine.
 */
export function analyzeDeckPassport(
  deck: Deck,
  recommendation: RecommendationResult | null,
): DeckPassportResult | null {
  const cards = deck.cards ?? [];
  if (cards.length !== 8) return null;
  if (!recommendation) return null;

  const cardNames = collectCardNames(cards);
  const archetype = recommendation.intent.archetype || detectDeckArchetype(cardNames);
  const playStyle = (recommendation.intent.play_style || detectPlayStyle(cardNames, archetype)) as PlayStyle;
  const metrics = computeDeckMetrics(cardNames, archetype);
  const score = computeGhosteekScore(metrics);
  const stars = computeStars(score);
  const difficulty = computeDifficulty(cardNames, archetype, metrics);
  const practicality = computePracticality(
    cardNames,
    cards,
    archetype,
    metrics,
    difficulty,
  );
  // Role checklist фильтруем required_role_ids из Engine Intent
  const roleBalance = evaluateRoleBalance(cardNames, {
    archetype: recommendation.intent.archetype,
    playStyle: recommendation.intent.play_style,
    primaryWin: recommendation.intent.primary_win,
    requiredSoftChecks: new Set(recommendation.intent.required_soft_checks),
    minAirDefense: recommendation.intent.min_air_defense,
    requireBuilding: recommendation.intent.require_building,
    minCycleCards: recommendation.intent.min_cycle_cards,
    requiredRoleIds: new Set(recommendation.intent.required_role_ids),
    attackBias: recommendation.intent.attack_bias,
  });
  const matchupsRaw = getArchetypeMatchups(archetype);
  const strengths = buildStrengths(metrics, roleBalance);
  const weaknesses = weaknessesFromRecommendation(recommendation);
  const summary = buildSummary(
    score,
    archetype,
    playStyle,
    strengths,
    { strong: matchupsRaw.strongAgainst, weak: matchupsRaw.weakAgainst },
    metrics,
  );
  const gamePlan = gamePlanFromRecommendation(recommendation);

  return {
    score,
    stars,
    starsDisplay: starsDisplay(stars),
    metrics,
    attack: metrics.attack,
    defense: metrics.defense,
    control: metrics.control,
    counterpush: metrics.counterpush,
    cycleSpeed: metrics.cycleSpeed,
    antiAir: metrics.antiAir,
    antiGround: metrics.antiGround,
    antiTank: metrics.antiTank,
    swarmDefense: metrics.swarmDefense,
    versatility: metrics.versatility,
    stability: metrics.stability,
    archetype,
    playStyle,
    basicInfo: computeBasicInfo(cardNames, deckTypeLabel(archetype)),
    roleBalance,
    practicality: practicality.score,
    practicalityReasons: {
      positive: practicality.positives,
      negative: practicality.negatives,
    },
    difficulty: difficulty.level,
    strengths,
    weaknesses,
    matchups: {
      strong: matchupsRaw.strongAgainst,
      weak: matchupsRaw.weakAgainst,
    },
    summary,
    gamePlan,
    improvements: recommendation.improvement_plan.steps.map((s) => ({
      category: s.category,
      message: s.message,
      suggested_cards: s.suggested_cards,
    })),
    riskScore: recommendation.risk_assessment.score,
    decisionExplanation: recommendation.decision_explanation ?? null,
  };
}

export function getMetricDisplayList(metrics: DeckMetrics) {
  return METRIC_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: metrics[key],
  }));
}

export type { DeckMetrics, RoleBalanceEntry, DeckBasicInfo, PlayStyle, DifficultyLevel, DeckGamePlan };
