import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Flame, Clock, Brain, Swords, ChevronRight, Layers } from "lucide-react";
import { StatsOverview, InsightsData } from "@/types";
import { Card, Button, Loader } from "@/components/ui";
import { CardUsageGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { usePageRefresh } from "@/hooks";

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setInsightsError(null);
      const [data, insightData] = await Promise.all([
        api.getStats(),
        api.getInsights().catch((e) => {
          setInsightsError(e instanceof ApiError ? e.message : "Анализ боёв недоступен");
          return null;
        }),
      ]);
      setStats(data);
      setInsights(insightData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const lossInsights = useMemo(
    () => (insights?.insights ?? []).filter((item) => !item.won).slice(0, 7),
    [insights?.insights],
  );

  const lastResults = useMemo(() => {
    const items = stats?.last_results ?? [];
    return items.map((r, index) => {
      const trophyChange = Number(r.trophy_change) || 0;
      return {
        index,
        trophyChange,
        won: r.won,
        opponentName: r.opponent_name ?? "Соперник",
        playedDate: r.played_date ?? "",
        playedTime: r.played_time ?? "",
      };
    });
  }, [stats?.last_results]);

  const winrateByDay = useMemo(() => {
    const items = stats?.winrate_by_day ?? [];
    return [...items]
      .sort((a, b) => {
        const parse = (d: string) => {
          const [day, month] = d.split(".").map(Number);
          if (!day || !month) return 0;
          return month * 100 + day;
        };
        return parse(a.date) - parse(b.date);
      })
      .map((item) => {
        const total = item.wins + item.losses;
        const winrate =
          total > 0
            ? Math.round((item.wins / total) * 1000) / 10
            : item.winrate ?? 0;
        return { ...item, winrate };
      });
  }, [stats?.winrate_by_day]);
  const mostUsedCards = useMemo(() => stats?.most_used_cards ?? [], [stats?.most_used_cards]);

  if (loading) {
    return <Loader />;
  }

  if (error || !stats) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-2">{error ?? "Нет данных"}</p>
        <button type="button" onClick={() => void load()} className="text-cr-gold text-sm">
          Повторить
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Аналитика</h1>
        <p className="page-subtitle mt-1">Подробная статистика по вашим боям</p>
      </div>

      {(insights?.patterns.length || lossInsights.length) ? (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-cr-blue" />
            <h3 className="text-sm font-semibold text-cr-text">Разбор поражений</h3>
          </div>

          {insights?.patterns.length ? (
            <div className="space-y-2 mb-4">
              {insights.patterns.map((p, i) => (
                <p key={i} className="text-xs text-cr-gold bg-cr-gold/10 border border-cr-gold/20 rounded-lg px-3 py-2">
                  {p}
                </p>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {lossInsights.map((item) => (
              <button
                key={item.battle_index}
                type="button"
                onClick={() => navigate(`/battles/${item.battle_index}`)}
                className="w-full text-left rounded-xl border p-3 transition-colors hover:border-cr-gold/40 border-cr-loss/25 bg-cr-loss/5"
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <Swords className="w-4 h-4 text-cr-loss shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-cr-accent font-semibold mb-0.5">против {item.opponent_name}</p>
                    <p className="text-sm text-cr-text leading-snug">{item.summary}</p>
                    {item.matchup_score > 0 ? (
                      <p className="text-[11px] text-cr-muted mt-1">Матчап: {item.matchup_score.toFixed(0)}/100</p>
                    ) : null}
                  </div>
                  <ChevronRight className="w-5 h-5 text-cr-muted shrink-0 mt-0.5" />
                </div>
                {item.details.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-6">
                    {item.details.slice(0, 2).map((d, i) => (
                      <li key={i} className="text-[11px] text-cr-accent/90 font-medium leading-snug">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>
        </Card>
      ) : insightsError ? (
        <Card className="text-center text-sm text-cr-muted">{insightsError}</Card>
      ) : null}

      <Card className="border-cr-gold/25 bg-cr-gold/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cr-gold/15 border border-cr-gold/30 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-cr-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-cr-text">Мои колоды</h3>
            <p className="text-xs text-cr-muted mt-1 leading-relaxed">
              Оценка ваших колод по практичности относительно последних боёв
            </p>
            <div className="mt-3 space-y-3">
              <Button
                variant="secondary"
                className="w-full sm:w-auto !py-2 text-sm flex items-center justify-center gap-2"
                onClick={() => navigate("/decks?tab=mine")}
              >
                Открыть мои колоды
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto !py-2 text-sm flex items-center justify-center gap-2"
                  onClick={() => navigate("/decks?tab=arena")}
                >
                  Колоды моей арены
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <p className="text-[11px] text-cr-muted mt-1.5 leading-snug">
                  Сравнение вашей колоды относительно колод вашей арены
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего боёв", value: stats.total_battles, icon: Flame, color: "text-cr-gold" },
          { label: "Победы", value: stats.wins, icon: TrendingUp, color: "text-cr-win" },
          { label: "Поражения", value: stats.losses, icon: TrendingDown, color: "text-cr-loss" },
          { label: "Винрейт", value: `${stats.winrate.toFixed(1)}%`, icon: Clock, color: "text-cr-blue" },
        ].map((item, i) => (
          <Card key={i} className="text-center">
            <item.icon className={"w-6 h-6 mx-auto mb-2 " + item.color} />
            <p className="text-2xl font-bold text-cr-text">{item.value}</p>
            <p className="text-label">{item.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-2">Рост трофеев</h3>
          <p className="text-[11px] text-cr-muted mb-3">Только рейтинговые 1v1 · наведите на точку для деталей</p>
          <div className="h-[170px]">
            {lastResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lastResults} margin={{ top: 4, bottom: 4, left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="index" hide />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<TrophyGrowthTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="trophyChange"
                    name="Кубки"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={{ fill: "#fbbf24", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-10">Недостаточно рейтинговых боёв</p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-cr-text mb-3">Винрейт по дням</h3>
          <div className="h-[220px] -mx-1">
            {winrateByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={winrateByDay}
                  margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                  barCategoryGap="18%"
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    padding={{ left: 0, right: 0 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={20}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    stroke="#a78bfa"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(value, name) => {
                      if (name === "winrate") return [`${Number(value).toFixed(1)}%`, "Винрейт"];
                      if (name === "wins") return [value, "Победы"];
                      if (name === "losses") return [value, "Поражения"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar yAxisId="left" dataKey="wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="winrate"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: "#a78bfa", r: 3 }}
                    name="winrate"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-16">Нет данных по дням</p>
            )}
          </div>
          <p className="text-[11px] text-cr-muted mt-2 text-center">
            Фиолетовая линия — процент побед за день
          </p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Любимые карты</h3>
          {mostUsedCards.length > 0 ? (
            <CardUsageGrid
              items={mostUsedCards.slice(0, 6).map((c) => ({
                name: c.name,
                count: c.count,
                winrate: c.winrate,
              }))}
            />
          ) : (
            <p className="text-cr-muted text-sm text-center py-12">Нет данных по картам</p>
          )}
        </Card>
      </div>
    </div>
  );
}

export { AnalyticsPage as default };

type TrophyChartPoint = {
  opponentName: string;
  playedDate: string;
  playedTime: string;
  trophyChange: number;
  won: boolean;
};

function TrophyGrowthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TrophyChartPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const delta = point.trophyChange;
  return (
    <div className="rounded-xl border border-white/10 bg-[#181830] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-cr-text">против {point.opponentName}</p>
      {(point.playedDate || point.playedTime) && (
        <p className="text-cr-muted mt-0.5">
          {point.playedDate}
          {point.playedDate && point.playedTime ? " · " : ""}
          {point.playedTime}
        </p>
      )}
      <p className={delta >= 0 ? "text-cr-win font-bold mt-1" : "text-cr-loss font-bold mt-1"}>
        {delta > 0 ? "+" : ""}
        {delta} кубков
      </p>
      <p className="text-cr-muted mt-0.5">{point.won ? "Победа" : "Поражение"}</p>
    </div>
  );
}
