import { Bot, LineChart, Search, Swords, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProFeatureId =
  | "ai_coach"
  | "player_search"
  | "deck_improve"
  | "battle_detail"
  | "meta"
  | "subscription";

export interface ProFeature {
  id: ProFeatureId;
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Feature catalog shown on /pro and in every lock UI. */
export const PRO_FEATURES: ProFeature[] = [
  {
    id: "ai_coach",
    icon: Bot,
    title: "Ghosteek AI — тренер",
    description:
      "Чат по колодам, матчапам, картам и механикам. Разбор загруженного реплея с таймлайном и разбором ошибок.",
  },
  {
    id: "battle_detail",
    icon: Swords,
    title: "Детальный разбор боёв",
    description:
      "Тактика по фазам, план на матч, сложность матчапа, эликсир-профили и тренер боя. Базовая карточка боя остаётся бесплатной.",
  },
  {
    id: "deck_improve",
    icon: Wand2,
    title: "Улучшение колод",
    description:
      "Движок замен: что убрать, что поставить и почему — с оценкой каждой карты и разбором отклонённых вариантов.",
  },
  {
    id: "meta",
    icon: LineChart,
    title: "Полная мета",
    description:
      "Все метовые колоды лиги, кубков и КВ с историей популярности. Без Pro доступны только первые 5.",
  },
  {
    id: "player_search",
    icon: Search,
    title: "Поиск игроков",
    description:
      "Профиль по тегу: трофеи, лига, клан, текущая колода и винрейт последних боёв.",
  },
];

const FEATURE_BY_ID = new Map(PRO_FEATURES.map((f) => [f.id, f]));

export function proFeature(id?: string | null): ProFeature | null {
  if (!id) return null;
  return FEATURE_BY_ID.get(id as ProFeatureId) ?? null;
}

export const PRO_TITLE = "Ghosteek Pro";
export const PRO_TAGLINE = "Полный доступ к аналитике, тренеру и мете";

export function formatProExpiry(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function daysLeftWord(days: number): string {
  const abs = Math.abs(days) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

export function decksWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "колод";
  if (last === 1) return "колода";
  if (last >= 2 && last <= 4) return "колоды";
  return "колод";
}