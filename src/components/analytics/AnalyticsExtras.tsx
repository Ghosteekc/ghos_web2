import { useCallback, useEffect, useState } from "react";
import { Shield, Swords, Wand2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { Card, Button, Loader } from "@/components/ui";
import { CardDeckGrid } from "@/components/cards";
import type { CounterDeckData, CustomizeData, OpponentEntry, SynergyData, WinrateEntry } from "@/types";

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
  const [counter, setCounter] = useState<CounterDeckData | null>(null);
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
    setLoadingId(index);
    try {
      setCounter(await api.getCounterDeck(index));
    } catch {
      setCounter(null);
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
      {opponents.map((opp) => (
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
              className="!py-1.5 !px-3 text-xs shrink-0"
              disabled={loadingId === opp.index}
              onClick={() => void loadCounter(opp.index)}
            >
              <Swords className="w-3.5 h-3.5 mr-1" />
              Контр
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
        </Card>
      ))}

      {counter && (
        <Card className="border-cr-win/30 bg-cr-win/5">
          <h3 className="text-sm font-semibold text-cr-text mb-1">Контр-колода vs {counter.opponent_name}</h3>
          <p className="text-xs text-cr-muted mb-3">Под ваш арсенал и арену</p>
          <CardDeckGrid cards={counter.counter_deck} size="sm" showLabels maxVisible={8} />
        </Card>
      )}
    </div>
  );
}

export function DeckToolsPanel() {
  const [customize, setCustomize] = useState<CustomizeData | null>(null);
  const [synergy, setSynergy] = useState<SynergyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [custom, syn] = await Promise.all([
        api.getCustomizeDeck().catch(() => null),
        api.getSynergyDeck().catch(() => null),
      ]);
      setCustomize(custom);
      setSynergy(syn);
      if (!custom && !syn) {
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
  if (error && !customize && !synergy) return <ErrorCard message={error} />;

  return (
    <div className="space-y-4">
      {customize && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Улучшение колоды</h3>
          </div>
          <p className="text-xs text-cr-muted mb-3">Ср. эликсир: {customize.avg_elixir.toFixed(1)}</p>
          <p className="text-xs text-cr-muted mb-2">Было</p>
          <CardDeckGrid cards={customize.original} size="sm" showLabels maxVisible={8} />
          <p className="text-xs text-cr-muted mb-2 mt-4">Стало</p>
          <CardDeckGrid cards={customize.customized} size="sm" showLabels maxVisible={8} />
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
        </Card>
      )}

      {synergy && (
        <Card className="border-cr-blue/25">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-cr-blue" />
            <h3 className="font-semibold text-cr-text">Синергии</h3>
          </div>
          <p className="text-xs text-cr-muted mb-2">
            Ядро: {synergy.core.join(", ")} · эликсир {synergy.avg_elixir.toFixed(1)}
          </p>
          <CardDeckGrid cards={synergy.deck} size="sm" showLabels maxVisible={8} />
        </Card>
      )}
    </div>
  );
}
