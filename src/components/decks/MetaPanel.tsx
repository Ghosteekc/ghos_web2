import { useCallback, useEffect, useState } from "react";
import { Card, Loader, ErrorState, EmptyState } from "@/components/ui";
import { PlayerDeckGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { cn } from "@/utils";
import { usePageRefresh } from "@/hooks";
import type { MetaLadderData, MetaLadderDeck, MetaWarData, MetaWarDeck } from "@/types";
import { MetaSparkline } from "./MetaSparkline";

type MetaTab = "league" | "trophies" | "clan-wars";

const TABS: { id: MetaTab; label: string }[] = [
  { id: "league", label: "Лига" },
  { id: "trophies", label: "Кубки" },
  { id: "clan-wars", label: "КВ" },
];

function formatUpdatedAt(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    const time = date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `сегодня, ${time}`;
    }
    const day = date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
    return `${day}, ${time}`;
  } catch {
    return null;
  }
}

function formatGames(n: number) {
  return n.toLocaleString("ru-RU");
}

function gamesWord(n: number) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "боёв";
  if (last === 1) return "бой";
  if (last >= 2 && last <= 4) return "боя";
  return "боёв";
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "meta-deck-rank",
        rank === 1 && "meta-deck-rank--1",
        rank === 2 && "meta-deck-rank--2",
        rank === 3 && "meta-deck-rank--3",
      )}
    >
      #{rank}
    </span>
  );
}

function TrendMark({ trend, percent }: { trend: string; percent: number | null }) {
  if (trend === "up") {
    return (
      <span className="meta-deck-trend meta-deck-trend--up">
        ↑{percent != null ? ` ${percent.toFixed(1)}%` : ""}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="meta-deck-trend meta-deck-trend--down">
        ↓{percent != null ? ` ${Math.abs(percent).toFixed(1)}%` : ""}
      </span>
    );
  }
  return <span className="meta-deck-trend meta-deck-trend--stable">→ стабильно</span>;
}

function LadderCard({ deck, index }: { deck: MetaLadderDeck; index: number }) {
  const wrClass = deck.win_rate >= 50 ? "text-cr-win" : "text-cr-loss";
  const updated = formatUpdatedAt(deck.last_seen);
  const historyDays = deck.history.length;

  return (
    <Card className="meta-deck-card" delay={Math.min(index, 8) * 0.04}>
      <div className="meta-deck-head">
        <RankBadge rank={deck.rank} />
        {deck.history_available ? (
          <TrendMark trend={deck.trend} percent={deck.trend_percent} />
        ) : (
          <span className="meta-deck-trend meta-deck-trend--muted">мало истории</span>
        )}
      </div>

      <PlayerDeckGrid
        cards={deck.cards}
        size="lg"
        showLabels
        gapClassName="gap-x-1.5 gap-y-2"
      />

      <div className="meta-deck-foot">
        <div className="meta-deck-metrics">
          <div className="min-w-0">
            <p className="meta-deck-games">
              {formatGames(deck.games_count)} {gamesWord(deck.games_count)}
            </p>
            <p className="meta-deck-games-hint">за выборку</p>
          </div>
          <p className={cn("meta-deck-wr", wrClass)}>{deck.win_rate.toFixed(1)}% WR</p>
        </div>

        {deck.history_available ? (
          <div className="meta-deck-spark">
            <MetaSparkline
              className="text-cr-gold/70"
              values={deck.history.map((point) => point.games)}
            />
            <p className="meta-deck-spark-caption">
              популярность{historyDays ? ` · ${historyDays} дн.` : ""}
            </p>
          </div>
        ) : (
          <p className="meta-deck-spark-empty">Недостаточно истории</p>
        )}

        {updated ? <p className="meta-deck-updated">Обновлено {updated}</p> : null}
      </div>
    </Card>
  );
}

function WarCard({ deck, index }: { deck: MetaWarDeck; index: number }) {
  return (
    <Card className="meta-deck-card" delay={Math.min(index, 8) * 0.04}>
      <div className="meta-deck-head">
        <RankBadge rank={deck.rank} />
        {deck.role ? <span className="meta-deck-trend meta-deck-trend--muted">{deck.role}</span> : null}
      </div>
      {deck.name ? <h3 className="meta-deck-war-name">{deck.name}</h3> : null}
      <PlayerDeckGrid
        cards={deck.cards}
        size="lg"
        showLabels
        gapClassName="gap-x-1.5 gap-y-2"
      />
      {deck.recommendation ? (
        <p className="meta-deck-war-note">{deck.recommendation}</p>
      ) : null}
    </Card>
  );
}

export function MetaPanel() {
  const [tab, setTab] = useState<MetaTab>("league");
  const [ladder, setLadder] = useState<MetaLadderData | null>(null);
  const [wars, setWars] = useState<MetaWarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "clan-wars") {
        setWars(await api.getMetaClanWars());
        setLadder(null);
      } else {
        const data = tab === "league" ? await api.getMetaLeague() : await api.getMetaTrophies();
        setLadder(data);
        setWars(null);
      }
    } catch (e) {
      setLadder(null);
      setWars(null);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить мету");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const updatedLabel = formatUpdatedAt(ladder?.updated_at ?? wars?.updated_at);
  const sampleNote = tab === "clan-wars" ? wars?.sample_note : ladder?.sample_note;
  const statusMessage =
    tab === "clan-wars" ? wars?.message : ladder?.status !== "ok" ? ladder?.message : null;

  return (
    <div className="space-y-4">
      <div className="filter-tab-row">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn("filter-tab", tab === item.id && "filter-tab--active pixel-btn--active")}
            aria-pressed={tab === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      {sampleNote ? <p className="text-xs text-cr-muted leading-snug">{sampleNote}</p> : null}
      {updatedLabel ? <p className="text-xs text-cr-muted">Обновлено: {updatedLabel}</p> : null}
      {!loading && !error && statusMessage && tab !== "clan-wars" && ladder && ladder.decks.length ? (
        <p className="text-xs text-cr-muted">{statusMessage}</p>
      ) : null}

      {loading ? <Loader /> : null}
      {error ? <ErrorState title={error} /> : null}

      {!loading && !error && tab !== "clan-wars" && ladder ? (
        ladder.decks.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ladder.decks.map((deck, index) => (
              <LadderCard key={deck.deck_hash} deck={deck} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState title={statusMessage || "Недостаточно данных для формирования актуальной меты."} />
        )
      ) : null}

      {!loading && !error && tab === "clan-wars" && wars ? (
        wars.decks.length ? (
          <div className="space-y-3">
            {wars.source ? (
              <p className="text-xs text-cr-muted">Источник: {wars.source}</p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wars.decks.map((deck, index) => (
                <WarCard key={`${deck.rank}-${deck.name}`} deck={deck} index={index} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title={statusMessage || "Готовые колоды КВ пока не загружены."} />
        )
      ) : null}
    </div>
  );
}
