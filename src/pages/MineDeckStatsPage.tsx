import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Shield,
  Swords,
  CheckCircle2,
} from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { MineDeckStats } from "@/types";
import { usePageRefresh, useCardCatalog } from "@/hooks";
import { UI } from "@/constants/labels";

function MatchupList({
  title,
  items,
  tone,
}: {
  title: string;
  items: MineDeckStats["strong_against"];
  tone: "win" | "loss";
}) {
  if (!items.length) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-cr-text mb-2">{title}</h3>
        <p className="text-sm text-cr-muted">Недостаточно боёв для выводов</p>
      </Card>
    );
  }

  const border = tone === "win" ? "border-cr-win/25 bg-cr-win/5" : "border-cr-loss/25 bg-cr-loss/5";

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        {tone === "win" ? (
          <TrendingUp className="w-5 h-5 text-cr-win" />
        ) : (
          <TrendingDown className="w-5 h-5 text-cr-loss" />
        )}
        <h3 className="text-sm font-semibold text-cr-text">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.card} className={`rounded-xl border p-3 ${border}`}>
            <div className="flex items-center gap-3">
              <div className="w-11 shrink-0">
                <CardTile name={item.card} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-cr-text truncate">{item.card_ru}</p>
                  <span className={`text-xs font-bold shrink-0 ${tone === "win" ? "text-cr-win" : "text-cr-loss"}`}>
                    {item.winrate.toFixed(0)}% · {item.games} {UI.games.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-cr-muted mt-1 leading-snug">{item.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MineDeckStatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deckKey = searchParams.get("deck") ?? "";
  const { nameRu } = useCardCatalog();
  const [data, setData] = useState<MineDeckStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!deckKey) {
      setError("Колода не указана");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const stats = await api.getMineDeckStats(deckKey);
      setData(stats);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки статистики");
    } finally {
      setLoading(false);
    }
  }, [deckKey]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const winConditionsRu = useMemo(() => {
    if (!data?.win_conditions?.length) return [];
    return data.win_conditions.map((c) => nameRu(c));
  }, [data?.win_conditions, nameRu]);

  if (loading) return <Loader />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Header onBack={() => navigate("/decks")} title="Статистика колоды" />
        <Card className="text-center space-y-3">
          <p className="text-cr-loss text-sm">{error ?? "Нет данных"}</p>
          <Button onClick={() => navigate("/decks")}>К колодам</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header onBack={() => navigate("/decks")} title={data.name || "Моя колода"} />

      {data.sample_note ? (
        <Card className="text-sm text-cr-muted">{data.sample_note}</Card>
      ) : null}

      <Card>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
          {data.cards.map((card) => (
            <CardTile
              key={card.id || card.name}
              name={card.name}
              icon={card.icon}
              size="deck"
              elixirCost={card.cost}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label={UI.winrate}
            value={`${data.winrate.toFixed(1)}%`}
            valueClass={data.winrate >= 50 ? "text-cr-win" : "text-cr-loss"}
          />
          <StatBox label={UI.games} value={String(data.total_games)} />
          <StatBox label="Победы" value={String(data.wins)} valueClass="text-cr-win" />
          <StatBox
            label="Ср. эликсир"
            value={`${data.avg_elixir.toFixed(1)} ⚗`}
          />
        </div>

        {winConditionsRu.length > 0 ? (
          <p className="text-xs text-cr-muted mt-3">
            Win-condition:{" "}
            <span className="text-cr-gold font-semibold">{winConditionsRu.join(", ")}</span>
          </p>
        ) : null}
      </Card>

      <MatchupList title="Сильнее против карт соперника" items={data.strong_against} tone="win" />
      <MatchupList title="Сложнее против карт соперника" items={data.weak_against} tone="loss" />

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-cr-gold" />
          <h3 className="text-sm font-semibold text-cr-text">Рекомендации по улучшению</h3>
        </div>

        {data.balanced ? (
          <div className="flex items-start gap-3 rounded-xl border border-cr-win/30 bg-cr-win/10 p-4">
            <CheckCircle2 className="w-5 h-5 text-cr-win shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-cr-text">Колода сбалансирована</p>
              <p className="text-xs text-cr-muted mt-1">
                Защита, заклинания, сплеш и темп на хорошем уровне — улучшения не требуются.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.improvements.map((item) => (
              <div
                key={item.category + item.message}
                className="rounded-xl border border-cr-border/60 bg-cr-bg/40 p-3"
              >
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-cr-blue shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-cr-text leading-snug">{item.message}</p>
                    {item.suggested_cards.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.suggested_cards.map((card) => (
                          <div key={card} className="w-10">
                            <CardTile name={card} size="xs" />
                            <p className="text-[9px] text-cr-muted text-center mt-0.5 truncate">
                              {nameRu(card)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Button variant="secondary" className="w-full" onClick={() => navigate("/decks")}>
        <Swords className="w-4 h-4 mr-2" />
        К моим колодам
      </Button>
    </div>
  );
}

function StatBox({
  label,
  value,
  valueClass = "text-cr-text",
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-cr-bg/50 px-3 py-2 text-center">
      <p className="text-[10px] text-cr-muted uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold tabular-nums mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" onClick={onBack} className="!p-2 shrink-0">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="page-title !mb-0 truncate">{title}</h1>
    </div>
  );
}

export { MineDeckStatsPage as default };
