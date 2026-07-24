import { useCallback, useEffect, useMemo, useState } from "react";
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
import { TrendingUp, TrendingDown, Flame, Clock } from "lucide-react";
import { StatsOverview } from "@/types";
import { Card, FeatureNavGrid, Loader, ScrollToTopButton } from "@/components/ui";
import { api } from "@/api/client";
import { cacheGet, lsGet, TTL } from "@/api/cache";

const STATS_MEM_KEY = "stats-v5";
const STATS_LS_KEY = "stats-overview-v1";
const STATS_STALE_GRACE_MS = 7 * 24 * 60 * 60_000;

function bootstrapStats(): StatsOverview | null {
  return cacheGet<StatsOverview>(STATS_MEM_KEY) ?? lsGet<StatsOverview>(STATS_LS_KEY, TTL.stats, STATS_STALE_GRACE_MS);
}
import { usePageRefresh } from "@/hooks";
import { OpponentsPanel, DeckToolsPanel, LossAnalysisPanel } from "@/components/analytics/AnalyticsExtras";
import { RecommendationsPanel } from "@/components/analytics/recommendations";
import { ChartGlassTooltipShell, ChartTooltipAnchor } from "@/components/charts/ChartGlassTooltip";

const ANALYTICS_NAV = [
  { id: "recommendations", label: "Рекомендации", emoji: "💡" },
  { id: "losses", label: "Разбор поражений", emoji: "🧠" },
  { id: "opponents", label: "Соперники", emoji: "⚔️" },
  { id: "tools", label: "Улучшения", emoji: "🔧" },
] as const;

type AnalyticsSection = (typeof ANALYTICS_NAV)[number]["id"] | null;

const CHART_MARGIN = { top: 8, right: 8, left: 4, bottom: 4 };
const CHART_YAXIS_WIDTH = 32;

export function AnalyticsPage() {
  const [section, setSection] = useState<AnalyticsSection>(null);
  const [stats, setStats] = useState<StatsOverview | null>(() => bootstrapStats());
  const [loading, setLoading] = useState(() => !bootstrapStats());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const hasStats = Boolean(bootstrapStats());
    if (!hasStats) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      const fallback = bootstrapStats();
      if (fallback) {
        setStats(fallback);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

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

  const handleNavSelect = (id: string) => {
    setSection((prev) => (prev === id ? null : (id as AnalyticsSection)));
  };

  if (loading && section === null) {
    return <Loader />;
  }

  if ((error || !stats) && section === null) {
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
        <p className="page-subtitle mt-1">Статистика, соперники и улучшение колод</p>
        {refreshing && (
          <p className="text-[11px] text-cr-muted mt-1">Обновление данных…</p>
        )}
      </div>

      <FeatureNavGrid
        items={[...ANALYTICS_NAV]}
        activeId={section}
        onSelect={handleNavSelect}
      />

      {section === null && stats && (
        <>
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
              <ChartTooltipAnchor className="h-[170px]">
                {lastResults.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lastResults} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="index" hide />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={CHART_YAXIS_WIDTH} />
                      <Tooltip
                        content={<TrophyGrowthTooltip />}
                        wrapperStyle={{ outline: "none" }}
                        contentStyle={{
                          background: "transparent",
                          border: "none",
                          boxShadow: "none",
                          padding: 0,
                        }}
                      />
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
              </ChartTooltipAnchor>
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-cr-text mb-2">Винрейт по дням</h3>
              <ChartTooltipAnchor className="h-[220px]">
                {winrateByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={winrateByDay}
                      margin={CHART_MARGIN}
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
                        width={CHART_YAXIS_WIDTH}
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
                        content={<WinrateDayTooltip />}
                        cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                        wrapperStyle={{ outline: "none" }}
                        contentStyle={{
                          background: "transparent",
                          border: "none",
                          boxShadow: "none",
                          padding: 0,
                        }}
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
              </ChartTooltipAnchor>
              <p className="text-[11px] text-cr-muted mt-2 text-center">
                Фиолетовая линия — процент побед за день
              </p>
            </Card>
          </div>
        </>
      )}

      {section === "recommendations" && <RecommendationsPanel />}
      {section === "losses" && <LossAnalysisPanel />}
      {section === "opponents" && <OpponentsPanel />}
      {section === "tools" && <DeckToolsPanel />}

      {section !== null && <ScrollToTopButton />}
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
  coordinate,
}: {
  active?: boolean;
  payload?: { payload: TrophyChartPoint }[];
  coordinate?: { x?: number; y?: number };
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const delta = point.trophyChange;
  return (
    <ChartGlassTooltipShell active={active} coordinate={coordinate}>
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
    </ChartGlassTooltipShell>
  );
}

type WinrateTooltipRow = {
  name?: string;
  value?: number;
  dataKey?: string;
};

function WinrateDayTooltip({
  active,
  payload,
  label,
  coordinate,
}: {
  active?: boolean;
  payload?: WinrateTooltipRow[];
  label?: string;
  coordinate?: { x?: number; y?: number };
}) {
  if (!active || !payload?.length) return null;

  const wins = payload.find((item) => item.dataKey === "wins")?.value;
  const losses = payload.find((item) => item.dataKey === "losses")?.value;
  const winrate = payload.find((item) => item.dataKey === "winrate")?.value;

  return (
    <ChartGlassTooltipShell active={active} coordinate={coordinate}>
      {label ? <p className="font-semibold text-cr-text mb-1.5">{label}</p> : null}
      {wins != null ? (
        <p className="font-semibold text-cr-win">
          Победы : {wins}
        </p>
      ) : null}
      {losses != null ? (
        <p className="font-semibold text-cr-loss mt-0.5">
          Поражения : {losses}
        </p>
      ) : null}
      {winrate != null ? (
        <p className="font-semibold text-[#a78bfa] mt-0.5">
          Винрейт : {Number(winrate).toFixed(1)}%
        </p>
      ) : null}
    </ChartGlassTooltipShell>
  );
}
