/** Игровой контекст страницы → GhosteekAiContext (API). */

import type { NavigateFunction } from "react-router-dom";

export type AiPageSource = "constructor" | "battle" | "matchup" | "card";

/** Зеркало bot.api.schemas.GhosteekAiContext + метаданные UI. */
export type AiPageContext = {
  source: AiPageSource;
  cards?: string[];
  opponent_cards?: string[];
  battle_index?: number;
  battle_time?: string;
  /** Подпись чипа в чате */
  label: string;
  /** Сообщение, которое уходит автоматически при входе в чат */
  autoPrompt: string;
  /** Отправить autoPrompt один раз после открытия */
  pendingAuto: boolean;
};

export type GhosteekAiAskContext = {
  cards?: string[];
  opponent_cards?: string[];
  battle_index?: number;
  battle_time?: string;
  replay?: {
    status: string;
    filename?: string;
    duration_seconds?: number;
    width?: number;
    height?: number;
    confidence?: number | null;
  };
};

const SS_KEY = "ghosteek-ai-page-context-v1";

export function toAskContext(ctx: AiPageContext | null | undefined): GhosteekAiAskContext | undefined {
  if (!ctx) return undefined;
  const out: GhosteekAiAskContext = {};
  if (ctx.cards?.length) out.cards = ctx.cards.slice(0, 8);
  if (ctx.opponent_cards?.length) out.opponent_cards = ctx.opponent_cards.slice(0, 8);
  if (typeof ctx.battle_index === "number") out.battle_index = ctx.battle_index;
  if (ctx.battle_time) out.battle_time = ctx.battle_time;
  return Object.keys(out).length ? out : undefined;
}

export function stashAiPageContext(ctx: AiPageContext): void {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(ctx));
  } catch {
    /* private mode */
  }
}

export function peekAiPageContext(): AiPageContext | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiPageContext;
    if (!parsed || typeof parsed !== "object" || !parsed.source) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAiPageContext(): void {
  try {
    sessionStorage.removeItem(SS_KEY);
  } catch {
    /* ignore */
  }
}

export function markAiPageContextAutoDone(ctx: AiPageContext): AiPageContext {
  const next = { ...ctx, pendingAuto: false };
  stashAiPageContext(next);
  return next;
}

/** Открыть чат с контекстом страницы. */
export function openGhosteekAi(navigate: NavigateFunction, ctx: AiPageContext): void {
  stashAiPageContext({ ...ctx, pendingAuto: true });
  navigate("/ai", { state: { aiContext: ctx } });
}

export function contextFromConstructor(cards: string[]): AiPageContext {
  const names = cards.filter(Boolean).slice(0, 8);
  return {
    source: "constructor",
    cards: names,
    label: names.length === 8 ? "Колода из конструктора" : `Ядро (${names.length})`,
    autoPrompt: names.length >= 8 ? "Разбери колоду" : "Собери колоду вокруг этих карт",
    pendingAuto: true,
  };
}

export function contextFromBattle(opts: {
  battleIndex: number;
  battleTime?: string;
  userDeck?: string[];
  opponentDeck?: string[];
  opponentName?: string;
}): AiPageContext {
  const user = (opts.userDeck ?? []).filter(Boolean).slice(0, 8);
  const opp = (opts.opponentDeck ?? []).filter(Boolean).slice(0, 8);
  const who = opts.opponentName?.trim() || "соперника";
  return {
    source: "battle",
    battle_index: opts.battleIndex,
    battle_time: opts.battleTime || undefined,
    cards: user.length === 8 ? user : undefined,
    opponent_cards: opp.length === 8 ? opp : undefined,
    label: `Бой vs ${who}`,
    autoPrompt: "Разбери этот бой",
    pendingAuto: true,
  };
}

export function contextFromMatchup(opts: {
  userDeck: string[];
  opponentDeck: string[];
  referenceName?: string;
}): AiPageContext {
  return {
    source: "matchup",
    cards: opts.userDeck.filter(Boolean).slice(0, 8),
    opponent_cards: opts.opponentDeck.filter(Boolean).slice(0, 8),
    label: opts.referenceName
      ? `Матчап vs «${opts.referenceName}»`
      : "Матчап двух колод",
    autoPrompt: "Разбери матчап",
    pendingAuto: true,
  };
}

export function contextFromCard(cardName: string, cardNameRu?: string): AiPageContext {
  const name = cardName.trim();
  const display = (cardNameRu || name).trim();
  return {
    source: "card",
    cards: [name],
    label: `Карта: ${display}`,
    autoPrompt: `Расскажи про карту ${name}`,
    pendingAuto: true,
  };
}
