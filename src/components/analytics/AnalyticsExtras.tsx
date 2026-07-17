import { useCallback, useEffect, useState } from "react";
import { Shield, Swords, Wand2, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { cacheInvalidate } from "@/api/cache";
import { Card, Button, Loader } from "@/components/ui";
import { CardDeckGrid } from "@/components/cards";
import { useCardCatalog, useTelegram } from "@/hooks";
import { cn } from "@/utils";
import type { CounterDeckData, CustomizeData, OpponentEntry, WinrateEntry } from "@/types";

function decksEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((card, i) => card === b[i]);
}

function DeckImportButton({ deckLink, label }: { deckLink?: string | null; label: string }) {
  const { openLink, showAlert } = useTelegram();

  const importDeck = async () => {
    if (!deckLink) return;
    if (openLink) {
      openLink(deckLink);
      return;
    }
    try {
      await navigator.clipboard.writeText(deckLink);
      showAlert?.("Ссылка на колоду скопирована");
    } catch {
      showAlert?.("Откройте приложение из Telegram для импорта колоды");
    }
  };

  if (!deckLink) {
    return (
      <p className="text-[11px] text-cr-muted mt-3">
        Импорт недоступен — не все карты распознаны
      </p>
    );
  }

  return (
    <Button
      variant="secondary"
      className="mt-3 w-full !py-2 text-sm flex items-center justify-center gap-2"
      onClick={() => void importDeck()}
    >
      <ExternalLink className="w-4 h-4" />
      {label}
    </Button>
  );
}

function ErrorCard({ message }: { message: string }) {
  return <Card className="text-center text-cr-loss text-sm">{message}</Card>;
}

export function DeckWinratesPanel() {
  const [rows, setRows] = useState<WinrateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await api.getWinrates());
    } catch (e) {
      setRows([]);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить винрейт");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader />;
  if (error) return <ErrorCard message={error} />;
  if (!rows.length) {
    return <Card className="text-center text-cr-muted text-sm">Сыграйте бои — появится статистика по колодам</Card>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <Card key={i} delay={i * 0.03}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-cr-text">
              <span className="text-cr-win">{row.wins} побед</span>
              <span className="text-cr-muted"> · </span>
              <span className="text-cr-loss">{row.losses} поражений</span>
              <span className="text-cr-muted"> · {row.total} игр</span>
            </span>
            <span className={`text-sm font-bold ${row.winrate >= 50 ? "text-cr-win" : "text-cr-loss"}`}>
              {row.winrate.toFixed(1)}%
            </span>
          </div>
          <CardDeckGrid cards={row.cards} size="sm" showLabels maxVisible={8} />
        </Card>
      ))}
    </div>
  );
}

export function OpponentsPanel() {
  const [opponents, setOpponents] = useState<OpponentEntry[]>([]);
  const [counters, setCounters] = useState<Record<number, CounterDeckData>>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOpponents(await api.getOpponents());
    } catch (e) {
      setOpponents([]);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить соперников");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCounter = async (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null);
      return;
    }

    setActiveIndex(index);

    if (counters[index]) {
      return;
    }

    setLoadingId(index);
    try {
      const data = await api.getCounterDeck(index);
      setCounters((prev) => ({ ...prev, [index]: data }));
    } catch {
      setActiveIndex(null);
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorCard message={error} />;
  if (!opponents.length) {
    return <Card className="text-center text-cr-muted text-sm">Нет данных о колодах соперников</Card>;
  }

  return (
    <div className="space-y-4">
      {opponents.map((opp) => {
        const isOpen = activeIndex === opp.index;
        const counter = counters[opp.index];
        const isLoadingCounter = loadingId === opp.index;

        return (
          <Card key={opp.index}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold text-cr-text flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cr-loss" />
                  {opp.name}
                </p>
                <p className="text-xs text-cr-muted mt-0.5">
                  {opp.won_against ? "Вы побеждали эту колоду" : "Проигрывали этой колоде"} · эликсир {opp.avg_elixir.toFixed(1)}
                </p>
              </div>
              <Button
                variant="secondary"
                className={cn(
                  "!py-1.5 !px-3 text-xs shrink-0",
                  isOpen && "border-cr-gold/60 text-cr-gold bg-cr-gold/10 hover:bg-cr-gold/15 active:bg-cr-gold/20",
                )}
                disabled={isLoadingCounter}
                onClick={() => void loadCounter(opp.index)}
              >
                <Swords className="w-3.5 h-3.5 mr-1" />
                {isOpen ? "Скрыть" : "Контр"}
              </Button>
            </div>
            {opp.threats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {opp.threats.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-cr-loss/10 text-cr-loss border border-cr-loss/20">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <CardDeckGrid cards={opp.deck} size="sm" showLabels maxVisible={8} />

            {isOpen && (
              <div className="mt-3 pt-3 border-t border-cr-win/20 rounded-lg bg-cr-win/5 px-3 pb-3 -mx-1">
                {isLoadingCounter ? (
                  <p className="text-xs text-cr-muted text-center py-2">Подбираем контр-колоду…</p>
                ) : counter ? (
                  <>
                    <h3 className="text-sm font-semibold text-cr-text mb-1">
                      Контр-колода vs {counter.opponent_name}
                    </h3>
                    <p className="text-xs text-cr-muted mb-3">Под ваш арсенал и арену</p>
                    <CardDeckGrid cards={counter.counter_deck} size="sm" showLabels maxVisible={8} />
                  </>
                ) : null}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export function DeckToolsPanel() {
  const [customize, setCustomize] = useState<CustomizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      if (force) {
        cacheInvalidate("customize-v5");
      }
      const custom = await api.getCustomizeDeck().catch(() => null);
      setCustomize(custom);
      if (!custom) {
        setError("Недостаточно боёв для рекомендаций");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader />;
  if (error && !customize) return <ErrorCard message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-cr-muted px-3 py-2 text-xs"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void load(true).finally(() => setRefreshing(false));
          }}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>
      {customize && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Улучшение колоды</h3>
          </div>
          <p className="text-xs text-cr-muted mb-3">Ср. эликсир: {customize.avg_elixir.toFixed(1)}</p>
          <p className="text-xs text-cr-muted mb-2">Было</p>
          <CardDeckGrid cards={customize.original} size="sm" showLabels maxVisible={8} />
          {!decksEqual(customize.original, customize.customized) ? (
            <>
              <p className="text-xs text-cr-muted mb-2 mt-4">Стало</p>
              <CardDeckGrid cards={customize.customized} size="sm" showLabels maxVisible={8} />
            </>
          ) : (
            <p className="text-xs text-cr-muted mt-4">Колода подходит для вашей арены — обязательных замен нет</p>
          )}
          {customize.issues.length > 0 && (
            <button
              type="button"
              className="mt-3 flex items-center gap-1 text-xs text-cr-gold"
              onClick={() => setShowIssues((v) => !v)}
            >
              {showIssues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Замечания ({customize.issues.length})
            </button>
          )}
          {showIssues && (
            <ul className="mt-2 space-y-1 text-xs text-cr-muted">
              {customize.issues.map((issue, i) => (
                <li key={i}>· {issue}</li>
              ))}
            </ul>
          )}
          {!decksEqual(customize.original, customize.customized) && (
            <DeckImportButton deckLink={customize.deck_link} label="Импорт улучшенной колоды" />
          )}
        </Card>
      )}
    </div>
  );
}
