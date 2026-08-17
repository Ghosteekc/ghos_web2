import { memo, useMemo } from "react";
import {
  Trophy,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatTime, getTrophyChangeColor, cn, formatBattlePlayedAt, formatOpponentHeadline } from "@/utils";
import type { BattleSummary, DeckCard } from "@/types";
import { Card, ElixirIcon } from "@/components/ui";
import { toDeckCards } from "@/components/cards/PlayerDeckGrid";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { BattleLeagueBadgeLabel, BattleLeaguePair } from "@/components/battles/BattleLeagueMark";

interface BattleCardSimpleProps {
  summary: BattleSummary;
  onOpen: () => void;
}

function deckAvgElixir(
  cards: Array<DeckCard | string> | null | undefined,
  resolveElixir: (name: string) => number | null | undefined,
): number | null {
  const items = toDeckCards(cards).slice(0, 8);
  if (!items.length) return null;
  let sum = 0;
  let n = 0;
  for (const card of items) {
    const fromCard = card.cost > 0 && card.cost < 99 ? card.cost : null;
    const fromCatalog = resolveElixir(card.name);
    const cost =
      fromCard ??
      (fromCatalog != null && fromCatalog > 0 && fromCatalog < 99 ? fromCatalog : null);
    if (cost == null) continue;
    sum += cost;
    n += 1;
  }
  if (!n) return null;
  return Math.round((sum / n) * 10) / 10;
}

/** Lightweight 4×2 deck for battle list — plain images, no CardTile tree. */
function LightBattleDeckStrip({
  cards,
}: {
  cards: Array<DeckCard | string> | null | undefined;
}) {
  const { iconUrl } = useCardCatalog();
  const items = useMemo(() => toDeckCards(cards).slice(0, 8), [cards]);

  return (
    <div className="battle-light-deck grid grid-cols-4 gap-[0.3rem]">
      {items.map((card, index) => {
        const src = card.icon || iconUrl(card.name) || "";
        const evo = (card.evolution_level ?? 0) >= 1 && !card.is_hero;
        const hero = Boolean(card.is_hero);
        return (
          <div
            key={`${card.id}-${index}`}
            className={cn(
              "battle-light-deck-slot relative aspect-[4/5] overflow-visible rounded-[0.25rem]",
              evo && "battle-light-deck-slot--evo",
              hero && "battle-light-deck-slot--hero",
            )}
          >
            <div className="absolute inset-0 overflow-hidden rounded-[0.25rem] bg-cr-bg/40">
              {src ? (
                <img
                  src={src}
                  alt=""
                  width={64}
                  height={80}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              ) : (
                <span className="flex h-full items-center justify-center text-3xs font-bold text-cr-muted">
                  {card.name.charAt(0)}
                </span>
              )}
            </div>
            {card.level != null && card.level > 0 ? (
              <span
                className="cr-level-badge battle-light-deck-level-badge"
                aria-label={`Уровень ${card.level}`}
              >
                {card.level}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const LightBattleDeckStripMemo = memo(LightBattleDeckStrip);

function BattleCardSimpleInner({ summary, onOpen }: BattleCardSimpleProps) {
  const { getCard } = useCardCatalog();
  const opponent = useMemo(
    () => formatOpponentHeadline(summary.opponent_name, summary.opponent_tag),
    [summary.opponent_name, summary.opponent_tag],
  );
  const playedAt = useMemo(
    () => formatBattlePlayedAt(summary.timestamp, summary.played_at),
    [summary.timestamp, summary.played_at],
  );
  const userCards = summary.user_deck_cards?.length
    ? summary.user_deck_cards
    : summary.user_deck;
  const opponentCards = summary.opponent_deck_cards?.length
    ? summary.opponent_deck_cards
    : summary.opponent_deck;

  const myAvg = useMemo(
    () => deckAvgElixir(userCards, (name) => getCard(name)?.elixir),
    [userCards, getCard],
  );
  const enemyAvg = useMemo(
    () => deckAvgElixir(opponentCards, (name) => getCard(name)?.elixir),
    [opponentCards, getCard],
  );
  const fallbackAvg = summary.avg_elixir != null && summary.avg_elixir > 0 ? summary.avg_elixir : null;

  return (
    <Card
      noMotion
      className="battle-history-card cursor-pointer relative overflow-hidden !shadow-none"
      onClick={onOpen}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          summary.won ? "bg-cr-win" : "bg-cr-loss",
        )}
      />
      <div className="pl-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {summary.won ? (
              <Trophy className="w-5 h-5 text-cr-win" />
            ) : (
              <Flame className="w-5 h-5 text-cr-loss" />
            )}
            <span className={cn("font-semibold text-base", summary.won ? "text-cr-win" : "text-cr-loss")}>
              {summary.won ? "Победа" : "Поражение"}
            </span>
            {summary.is_ranked ? <BattleLeagueBadgeLabel /> : null}
          </div>
          <span className={cn("text-base font-bold", getTrophyChangeColor(summary.trophy_change))}>
            {summary.trophy_change >= 0 ? "+" : ""}{summary.trophy_change} 🏆
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 pr-2">
            <p className="text-base font-medium text-cr-text truncate">против {opponent.title}</p>
            {opponent.tagLine ? (
              <p className="text-sm text-cr-muted truncate">{opponent.tagLine}</p>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            {playedAt ? (
              <p className="text-sm font-semibold text-cr-gold">{playedAt}</p>
            ) : null}
            {(summary.duration ?? 0) > 0 ? (
              <p className="text-sm text-cr-muted">{formatTime(summary.duration)}</p>
            ) : null}
            <p className="text-sm font-semibold flex items-center gap-1 justify-end tabular-nums">
              <ElixirIcon size={12} />
              <span className="text-cr-accent">
                {(myAvg ?? fallbackAvg ?? 0).toFixed(1)}
              </span>
              <span className="text-cr-muted font-medium">/</span>
              <span className="text-cr-loss/80">
                {(enemyAvg ?? fallbackAvg ?? 0).toFixed(1)}
              </span>
            </p>
          </div>
        </div>

        {summary.is_ranked ? (
          <BattleLeaguePair
            user={summary.user_league}
            opponent={summary.opponent_league}
            compact
            className="mb-2"
          />
        ) : null}

        <div className="battle-decks-stack relative">
          <div className="min-w-0 pr-4 space-y-1.5">
            <div className="battle-deck-frame battle-deck-frame--mine">
              <LightBattleDeckStripMemo cards={userCards} />
            </div>
            <div className="battle-decks-vs flex items-center justify-center" aria-hidden>
              <span className="battle-decks-vs-label">VS</span>
            </div>
            <div className="battle-deck-frame battle-deck-frame--enemy">
              <LightBattleDeckStripMemo cards={opponentCards} />
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-cr-muted">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {summary.top_reason ? (
          <p className="text-sm text-cr-muted mt-2 leading-snug line-clamp-2">{summary.top_reason}</p>
        ) : null}
      </div>
    </Card>
  );
}

export const BattleCardSimple = memo(BattleCardSimpleInner);
