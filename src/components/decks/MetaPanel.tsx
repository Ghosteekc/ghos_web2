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
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function formatGames(n: number) {
  return n.toLocaleString("ru-RU");
}

function TrendMark({ trend, percent }: { trend: string; percent: number | null }) {
  if (trend === "up") {
    return (
      <span className="text-sm font-semibold text-cr-win">
        ↑{percent != null ? ` ${percent.toFixed(1)}%` : ""}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="text-sm font-semibold text-cr-loss">
        ↓{percent != null ? ` ${Math.abs(percent).toFixed(1)}%` : ""}
      </span>
    );
  }
  return <span className="text-sm text-cr-muted">→ стабильно</span>;
}

function LadderCard({ deck }: { deck: MetaLadderDeck }) {
  const wrClass = deck.win_rate >= 50 ? "text-cr-win" : "text-cr-loss";
  return (
    <Card noMotion className="p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-cr-gold bg-cr-gold/10 px-2 py-0.5 rounded-full border border-cr-gold/20">
          #{deck.rank}
        </span>
        {deck.history_available ? (
          <TrendMark trend={deck.trend} percent={deck.trend_percent} />
        ) : (
          <span className="text-xs text-cr-muted">мало истории</span>
        )}
      </div>
      <PlayerDeckGrid cards={deck.cards} size="sm" className="mb-3" />
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-cr-text font-semibold tabular-nums">
            {formatGames(deck.games_count)} боёв
          </p>
          <p className={cn("text-sm font-bold tabular-nums", wrClass)}>
            {deck.win_rate.toFixed(1)}% WR
          </p>
        </div>
        {deck.history_available ? (
          <MetaSparkline
            className="text-cr-gold shrink-0"
            values={deck.history.map((point) => point.games)}
          />
        ) : (
          <p className="text-xs text-cr-muted shrink-0">Недостаточно истории</p>
        )}
      </div>
      {formatUpdatedAt(deck.last_seen) ? (
        <p className="text-xs text-cr-muted mt-2">Последнее обновление {formatUpdatedAt(deck.last_seen)}</p>
      ) : null}
    </Card>
  );
}

function WarCard({ deck }: { deck: MetaWarDeck }) {
  return (
    <Card noMotion className="p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-cr-gold bg-cr-gold/10 px-2 py-0.5 rounded-full border border-cr-gold/20">
          #{deck.rank}
        </span>
        {deck.role ? <span className="text-xs text-cr-muted">{deck.role}</span> : null}
      </div>
      {deck.name ? <h3 className="text-sm font-semibold text-cr-text mb-2">{deck.name}</h3> : null}
      <PlayerDeckGrid cards={deck.cards} size="sm" className="mb-2" />
      {deck.recommendation ? (
        <p className="text-xs text-cr-muted leading-snug">{deck.recommendation}</p>
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
            {ladder.decks.map((deck) => (
              <LadderCard key={deck.deck_hash} deck={deck} />
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
              {wars.decks.map((deck) => (
                <WarCard key={`${deck.rank}-${deck.name}`} deck={deck} />
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
