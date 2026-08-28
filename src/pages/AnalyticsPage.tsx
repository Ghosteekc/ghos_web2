import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Swords, Bot } from "lucide-react";
import { StatsOverview } from "@/types";
import { Card, FeatureNavGrid, Loader, ScrollToTopButton, Button, ErrorState, NoBattlesHint, isNoBattlesError, PageHeader } from "@/components/ui";
import { api, ApiError } from "@/api/client";
import { cacheGet, lsGet, TTL } from "@/api/cache";
import { getWinColor } from "@/utils";

const STATS_MEM_KEY = "stats-v8";
const STATS_LS_KEY = "stats-overview-v4";
const STATS_STALE_GRACE_MS = 7 * 24 * 60 * 60_000;

function bootstrapStats(): StatsOverview | null {
  return cacheGet<StatsOverview>(STATS_MEM_KEY) ?? lsGet<StatsOverview>(STATS_LS_KEY, TTL.stats, STATS_STALE_GRACE_MS);
}
import { usePageRefresh } from "@/hooks";
import { TabTransition } from "@/motion";
import { OpponentsPanel, DeckToolsPanel, LossAnalysisPanel } from "@/components/analytics/AnalyticsExtras";
import { RecommendationsPanel } from "@/components/analytics/recommendations";
import { ChartGlassTooltipShell, ChartTooltipAnchor, useChartScrub } from "@/components/charts/ChartGlassTooltip";

const ANALYTICS_NAV = [
  { id: "recommendations", label: "Прокачка\nкарт", emoji: "💡" },
  { id: "losses", label: "Разбор поражений", emoji: "🧠" },
  { id: "opponents", label: "Контра\nпо боям", emoji: "⚔️" },
  { id: "tools", label: "Улучшение\nколоды", emoji: "🔧" },
] as const;

type AnalyticsSection = (typeof ANALYTICS_NAV)[number]["id"] | null;

const ANALYTICS_SECTION_IDS = new Set<string>(ANALYTICS_NAV.map((item) => item.id));

function sectionFromParam(raw: string | null): AnalyticsSection {
  if (raw && ANALYTICS_SECTION_IDS.has(raw)) {
    return raw as NonNullable<AnalyticsSection>;
  }
  return null;
}

const CHART_MARGIN = { top: 8, right: 8, left: 4, bottom: 4 };
const CHART_YAXIS_WIDTH = 32;

function readChartGridStroke(): string {
  if (typeof document === "undefined") return "rgba(255,255,255,0.08)";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--cr-chart-grid")
    .trim();
  return value || "rgba(255,255,255,0.08)";
}

function useChartGridStroke(): string {
  const [stroke, setStroke] = useState(readChartGridStroke);
  useEffect(() => {
    const sync = () => setStroke(readChartGridStroke());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return stroke;
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = sectionFromParam(searchParams.get("section"));
  const [stats, setStats] = useState<StatsOverview | null>(() => bootstrapStats());
  const [loading, setLoading] = useState(() => !bootstrapStats());
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
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
      setErrorCode(null);
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      const fallback = bootstrapStats();
      if (fallback) {
        setStats(fallback);
        setError(null);
        setErrorCode(null);
      } else {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
        setErrorCode(e instanceof ApiError ? e.code : null);
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

  const trophyTotals = useMemo(() => {
    let gained = 0;
    let lost = 0;
    for (const point of lastResults) {
      if (point.trophyChange > 0) gained += point.trophyChange;
      else if (point.trophyChange < 0) lost += -point.trophyChange;
    }
    return { gained, lost };
  }, [lastResults]);

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
    const next = section === id ? null : id;
    if (next) {
      navigate(`/analytics?section=${encodeURIComponent(next)}`, { replace: true });
    } else {
      navigate("/analytics", { replace: true });
    }
  };

  if (loading && section === null) {
    return <Loader />;
  }

  if ((error || !stats) && section === null) {
    if (isNoBattlesError(errorCode ? { code: errorCode, message: error ?? "" } : error)) {
      return <NoBattlesHint />;
    }
    return (
      <ErrorState
        title={error ?? "Нет данных"}
        button="Повторить"
        onAction={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Аналитика"
        subtitle={<p className="page-subtitle">Статистика, соперники и улучшение колод</p>}
        action={
          <Button
            variant="secondary"
            onClick={() => navigate("/ai")}
            className="text-sm shrink-0 !px-3 !py-1.5 !min-h-0 !h-10 gap-1.5"
          >
            <Bot className="w-4 h-4 shrink-0" aria-hidden />
            Ghosteek AI
          </Button>
        }
      >
        {refreshing ? <p className="text-xs text-cr-muted">Обновление данных…</p> : null}
      </PageHeader>

      <FeatureNavGrid
        items={[...ANALYTICS_NAV]}
        activeId={section}
        onSelect={handleNavSelect}
      />

      {section === null && stats ? (
        <TabTransition tabKey="overview">
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Всего боёв", value: stats.total_battles, icon: Swords, color: "text-cr-gold" },
              { label: "Победы", value: stats.wins, icon: TrendingUp, color: "text-cr-win" },
              { label: "Поражения", value: stats.losses, icon: TrendingDown, color: "text-cr-loss" },
              {
                label: "Винрейт",
                value: `${stats.winrate.toFixed(1)}%`,
                icon: stats.winrate >= 50 ? TrendingUp : TrendingDown,
                color: getWinColor(stats.winrate),
                valueClass: getWinColor(stats.winrate),
              },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <item.icon className={"w-6 h-6 mx-auto mb-2 " + item.color} />
                <p className={"text-2xl font-bold " + (item.valueClass ?? "text-cr-text")}>{item.value}</p>
                <p className="text-label">{item.label}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="lg:col-span-2">
              <h3 className="chart-section-title text-base font-semibold text-cr-text mb-2">Винрейт по дням</h3>
              <p className="text-xs text-cr-muted mb-3">
                Фиолетовая линия — процент побед · ведите пальцем, тап — закрепить
              </p>
              <ChartTooltipAnchor className="h-[220px]" pointCount={winrateByDay.length}>
                {winrateByDay.length > 0 ? (
                  <WinrateDayChart data={winrateByDay} />
                ) : (
                  <p className="text-cr-muted text-base text-center pt-16">Нет данных по дням</p>
                )}
              </ChartTooltipAnchor>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="chart-section-title text-base font-semibold text-cr-text">Рост трофеев</h3>
                {lastResults.length > 0 ? (
                  <div className="text-right shrink-0 leading-tight">
                    <p className="text-sm font-bold text-cr-win">+{trophyTotals.gained}</p>
                    <p className="text-sm font-bold text-cr-loss">−{trophyTotals.lost}</p>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-cr-muted mb-3">
                Рейтинговые 1v1 · до 40 последних · ведите пальцем, тап — закрепить
              </p>
              <ChartTooltipAnchor className="h-[190px]" pointCount={lastResults.length}>
                {lastResults.length > 0 ? (
                  <TrophyGrowthChart data={lastResults} />
                ) : (
                  <p className="text-cr-muted text-base text-center pt-10">Недостаточно рейтинговых боёв</p>
                )}
              </ChartTooltipAnchor>
            </Card>
          </div>
        </>
        </TabTransition>
      ) : null}

      {section === "recommendations" ? (
        <TabTransition tabKey="recommendations">
          <RecommendationsPanel />
        </TabTransition>
      ) : null}
      {section === "losses" ? (
        <TabTransition tabKey="losses">
          <LossAnalysisPanel />
        </TabTransition>
      ) : null}
      {section === "opponents" ? (
        <TabTransition tabKey="opponents">
          <OpponentsPanel />
        </TabTransition>
      ) : null}
      {section === "tools" ? (
        <TabTransition tabKey="tools">
          <DeckToolsPanel />
        </TabTransition>
      ) : null}

      {section !== null && <ScrollToTopButton />}
    </div>
  );
}

export { AnalyticsPage as default };

function TrophyGrowthChart({ data }: { data: TrophyChartPoint[] }) {
  const scrub = useChartScrub();
  const gridStroke = useChartGridStroke();
  const point = scrub.activeIndex != null ? data[scrub.activeIndex] : null;
  const cursorX = point?.index;
  const stickyPointRef = useRef(point);
  const stickyCoordRef = useRef(scrub.coordinate);
  if (point) stickyPointRef.current = point;
  if (scrub.coordinate) stickyCoordRef.current = scrub.coordinate;
  const tipPoint = point ?? stickyPointRef.current;
  const tipCoord = scrub.coordinate ?? stickyCoordRef.current;

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={CHART_MARGIN}
          onMouseLeave={scrub.chartHandlers.onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="index" hide />
          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={CHART_YAXIS_WIDTH} />
          <Tooltip content={() => null} cursor={false} wrapperStyle={{ display: "none" }} />
          {scrub.isVisible && cursorX != null ? (
            <ReferenceLine x={cursorX} stroke="rgba(255,255,255,0.22)" strokeWidth={1} ifOverflow="extendDomain" />
          ) : null}
          <Line
            type="monotone"
            dataKey="trophyChange"
            name="Кубки"
            stroke="#fbbf24"
            strokeWidth={2}
            isAnimationActive={false}
            dot={{ fill: "#fbbf24", r: 3 }}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {tipPoint && tipCoord ? (
        <ChartGlassTooltipShell
          active={scrub.isVisible}
          coordinate={tipCoord}
          contentKey={`${tipPoint.index}-${tipPoint.opponentName}-${tipPoint.trophyChange}`}
        >
          {(tipPoint.playedDate || tipPoint.playedTime) && (
            <p className="text-cr-muted">
              {tipPoint.playedDate}
              {tipPoint.playedDate && tipPoint.playedTime ? " · " : ""}
              {tipPoint.playedTime}
            </p>
          )}
          <p className="font-semibold text-cr-text mt-1 px-0.5 break-words [overflow-wrap:anywhere] max-w-full">
            Против {tipPoint.opponentName}
          </p>
          <p className={tipPoint.trophyChange >= 0 ? "text-cr-win font-bold mt-1" : "text-cr-loss font-bold mt-1"}>
            {tipPoint.trophyChange > 0 ? "+" : ""}
            {tipPoint.trophyChange} кубков
          </p>
          <p className="text-cr-muted mt-0.5">{tipPoint.won ? "Победа" : "Поражение"}</p>
        </ChartGlassTooltipShell>
      ) : null}
    </>
  );
}

function WinrateDayChart({ data }: { data: WinrateDayPoint[] }) {
  const scrub = useChartScrub();
  const gridStroke = useChartGridStroke();
  const point = scrub.activeIndex != null ? data[scrub.activeIndex] : null;
  const stickyPointRef = useRef(point);
  const stickyCoordRef = useRef(scrub.coordinate);
  if (point) stickyPointRef.current = point;
  if (scrub.coordinate) stickyCoordRef.current = scrub.coordinate;
  const tipPoint = point ?? stickyPointRef.current;
  const tipCoord = scrub.coordinate ?? stickyCoordRef.current;

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={CHART_MARGIN}
          barCategoryGap="18%"
          barGap={2}
          onMouseLeave={scrub.chartHandlers.onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
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
          <Tooltip content={() => null} cursor={false} wrapperStyle={{ display: "none" }} />
          {scrub.isVisible && point ? (
            <ReferenceLine
              x={point.date}
              yAxisId="left"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />
          ) : null}
          <Bar yAxisId="left" dataKey="wins" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar yAxisId="left" dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="winrate"
            stroke="#a78bfa"
            strokeWidth={2}
            isAnimationActive={false}
            dot={{ fill: "#a78bfa", r: 3 }}
            activeDot={false}
            name="winrate"
          />
        </ComposedChart>
      </ResponsiveContainer>
      {tipPoint && tipCoord ? (
        <ChartGlassTooltipShell
          active={scrub.isVisible}
          coordinate={tipCoord}
          contentKey={`${tipPoint.date}-${tipPoint.wins}-${tipPoint.losses}`}
        >
          <p className="font-semibold text-cr-text mb-1.5">{tipPoint.date}</p>
          <p className="font-semibold text-cr-win">Победы : {tipPoint.wins}</p>
          <p className="font-semibold text-cr-loss mt-0.5">Поражения : {tipPoint.losses}</p>
          <p className="font-semibold text-[#a78bfa] mt-0.5">
            Винрейт : {Number(tipPoint.winrate).toFixed(1)}%
          </p>
        </ChartGlassTooltipShell>
      ) : null}
    </>
  );
}

type WinrateDayPoint = {
  date: string;
  wins: number;
  losses: number;
  winrate: number;
};

type TrophyChartPoint = {
  index: number;
  opponentName: string;
  playedDate: string;
  playedTime: string;
  trophyChange: number;
  won: boolean;
};
