/** Русские подписи категорий колод и общие UI-строки. */

export const DECK_CATEGORY_LABELS: Record<string, string> = {
  meta: "Мета",
  mine: "Мои",
  arena: "Арена",
  cycle: "Цикл",
  beatdown: "Натиск",
  control: "Контроль",
  bait: "Бейт",
  constructor: "Конструктор",
  random: "Рандом",
  top: "Топ",
};

export const DECK_FILTER_LABELS: Record<string, string> = {
  meta: "Мета",
  top: "Топ игроки",
  mine: "Мои",
  arena: "Арена",
  constructor: "Конструктор",
  random: "Рандом",
  favorites: "Избранное",
};

export const UI = {
  winrate: "Винрейт",
  winrateShort: "ВР",
  games: "Игр",
  battles: "боёв",
  avgElixir: "Ср. эликсир",
  subscriptionActive: "Активна",
} as const;
