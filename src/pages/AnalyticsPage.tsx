import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Flame, Clock, Brain, Trophy, Swords } from "lucide-react";
import { StatsOverview, InsightsData } from "@/types";
import { Card, Loader, Skeleton } from "@/components/ui";
import { CardUsageGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { usePageRefresh } from "@/hooks";

export function AnalyticsPage() {
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

  const lastResults = useMemo(
    () =>
      (stats?.last_results ?? []).slice(-14).map((r, i) => ({
        name: `Бой ${i + 1}`,
        rate: r.trophy_change,
        won: r.won,
      })),
    [stats?.last_results],
  );

  const winrateByDay = useMemo(() => {
    const items = stats?.winrate_by_day ?? [];
    return [...items].sort((a, b) => {
      const parse = (d: string) => {
        const [day, month] = d.split(".").map(Number);
        if (!day || !month) return 0;
        return month * 100 + day;
      };
      return parse(a.date) - parse(b.date);
    });
  }, [stats?.winrate_by_day]);
  const mostUsedCards = useMemo(() => stats?.most_used_cards ?? [], [stats?.most_used_cards]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Loader />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-[220px]">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    );
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

      {(insights?.patterns.length || insights?.insights.length) ? (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-cr-blue" />
            <h3 className="text-sm font-semibold text-cr-text">Разбор боёв</h3>
          </div>

          {insights.patterns.length > 0 && (
            <div className="space-y-2 mb-4">
              {insights.patterns.map((p, i) => (
                <p key={i} className="text-xs text-cr-gold bg-cr-gold/10 border border-cr-gold/20 rounded-lg px-3 py-2">
                  {p}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {insights.insights.map((item) => (
              <div
                key={item.battle_index}
                className={
                  "rounded-xl border p-3 " +
                  (item.won ? "border-cr-win/25 bg-cr-win/5" : "border-cr-loss/25 bg-cr-loss/5")
                }
              >
                <div className="flex items-start gap-2 mb-1.5">
                  {item.won ? (
                    <Trophy className="w-4 h-4 text-cr-win shrink-0 mt-0.5" />
                  ) : (
                    <Swords className="w-4 h-4 text-cr-loss shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-cr-accent font-semibold mb-0.5">vs {item.opponent_name}</p>
                    <p className="text-sm text-cr-text leading-snug">{item.summary}</p>
                  </div>
                </div>
                {item.details.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-6">
                    {item.details.slice(0, 2).map((d, i) => (
                      <li key={i} className="text-[11px] text-cr-accent/90 font-medium leading-snug">
                        {d.replace(/^[^\w\u0400-\u04FF]+/, "")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : insightsError ? (
        <Card className="text-center text-sm text-cr-muted">{insightsError}</Card>
      ) : null}

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
          <h3 className="text-sm font-semibold text-cr-text mb-4">Рост трофеев</h3>
          <div className="h-[220px]">
            {lastResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lastResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#f3f4f6" }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#fbbf24" strokeWidth={3} dot={{ fill: "#fbbf24", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-16">Недостаточно боёв</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Winrate по дням</h3>
          <div className="h-[220px]">
            {winrateByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winrateByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  />
                  <Bar dataKey="wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-16">Нет данных по дням</p>
            )}
          </div>
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
