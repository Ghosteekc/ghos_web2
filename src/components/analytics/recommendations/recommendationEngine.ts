import type { CollectionCardEntry } from "@/types";
import {
  ARENA_RECOMMENDATIONS,
  getArenaConfig,
  getRecommendedLevelForArena,
  resolveArenaByName,
  resolveArenaByTrophies,
} from "./arenaRecommendations";

export type CardRecommendationStatus = "ok" | "upgrade" | "missing";

export interface CardRecommendation {
  cardName: string;
  nameRu: string;
  icon: string;
  currentLevel: number | null;
  recommendedLevel: number;
  owned: boolean;
  status: CardRecommendationStatus;
}

export interface ArenaProgressSummary {
  arena: number;
  arenaName: string;
  recommendedLevel: number;
  progressPercent: number;
  meetingCount: number;
  totalCount: number;
  needsUpgradeCount: number;
  missingCount: number;
  cards: CardRecommendation[];
}

export interface PlayerArenaContext {
  trophies: number | null;
  arenaName: string | null;
  arenaId: number | null;
}

function normalizeCardName(name: string): string {
  return name.trim().toLowerCase();
}

function buildCollectionMap(cards: CollectionCardEntry[]): Map<string, CollectionCardEntry> {
  const map = new Map<string, CollectionCardEntry>();
  for (const card of cards) {
    map.set(normalizeCardName(card.name), card);
  }
  return map;
}

export function resolvePlayerArenaNumber(context: PlayerArenaContext): number {
  const trophies = context.trophies ?? 0;

  if (trophies >= 9000 || (context.arenaId ?? 0) >= 54_000_000) {
    return 24;
  }

  const byName = resolveArenaByName(context.arenaName);
  if (byName != null) {
    return byName;
  }

  return resolveArenaByTrophies(trophies);
}

function evaluateCard(
  cardName: string,
  recommendedLevel: number,
  collection: Map<string, CollectionCardEntry>,
): CardRecommendation {
  const entry = collection.get(normalizeCardName(cardName));
  const owned = Boolean(entry?.owned);
  const currentLevel = owned ? entry?.level ?? null : null;

  let status: CardRecommendationStatus = "missing";
  if (owned && currentLevel != null) {
    status = currentLevel >= recommendedLevel ? "ok" : "upgrade";
  }

  return {
    cardName,
    nameRu: entry?.name_ru ?? cardName,
    icon: entry?.icon ?? entry?.icon_base ?? "",
    currentLevel,
    recommendedLevel,
    owned,
    status,
  };
}

export function evaluateArenaProgress(
  arenaNumber: number,
  collectionCards: CollectionCardEntry[],
): ArenaProgressSummary {
  const config = getArenaConfig(arenaNumber);
  const recommendedLevel = getRecommendedLevelForArena(arenaNumber);
  const collection = buildCollectionMap(collectionCards);

  const cards = config.priorityCards.map((name) =>
    evaluateCard(name, recommendedLevel, collection),
  );

  const meetingCount = cards.filter((c) => c.status === "ok").length;
  const needsUpgradeCount = cards.filter((c) => c.status === "upgrade").length;
  const missingCount = cards.filter((c) => c.status === "missing").length;
  const totalCount = cards.length;
  const progressPercent =
    totalCount > 0 ? Math.round((meetingCount / totalCount) * 100) : 0;

  return {
    arena: config.arena,
    arenaName: config.name,
    recommendedLevel,
    progressPercent,
    meetingCount,
    totalCount,
    needsUpgradeCount,
    missingCount,
    cards,
  };
}

export function evaluateAllArenas(
  collectionCards: CollectionCardEntry[],
): ArenaProgressSummary[] {
  return ARENA_RECOMMENDATIONS.map((entry) => evaluateArenaProgress(entry.arena, collectionCards));
}

export function statusLabel(status: CardRecommendationStatus): string {
  switch (status) {
    case "ok":
      return "✅ Прокачка не требуется";
    case "upgrade":
      return "🔺 Рекомендуется прокачать";
    case "missing":
      return "⚪ Карта отсутствует в коллекции";
  }
}
