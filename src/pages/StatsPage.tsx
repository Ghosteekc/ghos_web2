import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Timer,
  Flame,
  Target,
} from "lucide-react";
import { Card, Loader, ElixirIcon } from "@/components/ui";
import { api } from "@/api/client";
import { StatsOverview } from "@/types";
import { formatNumber } from "@/utils";
import { usePageRefresh } from "@/hooks";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function computeStreak(results: { won: boolean }[]) {
  if (!results.length) return null;
  const type = results[0].won ? "win" : "loss";
  let count = 0;
  for (const r of results) {
    if (r.won === results[0].won) count++;
    else break;
  }
  return { type, count };
}

export function StatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const s = await api.getStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const records = useMemo(() => {
    if (!stats) return null;
    const results = stats.last_results ?? [];
    const streak = computeStreak(results);
    const trophyChanges = results.map((r) => r.trophy_change);
    const bestGain = trophyChanges.length ? Math.max(...trophyChanges) : 0;
    const worstLoss = trophyChanges.length ? Math.min(...trophyChanges) : 0;

    return { streak, bestGain, worstLoss };
  }, [stats]);

  if (loading) return <Loader />;
  if (!stats || !records) return <Card className="text-center">Нет данных</Card>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Рекорды</h1>
        <p className="page-subtitle mt-1">Показатели, которых нет в разделе «Аналитика»</p>
      </div>

      {records.streak && (
        <Card className="text-center">
          <p className="text-label mb-2">Текущая серия</p>
          <div className="flex items-center justify-center gap-2">
            {records.streak.type === "win" ? (
              <TrendingUp className="w-8 h-8 text-cr-win" />
            ) : (
              <TrendingDown className="w-8 h-8 text-cr-loss" />
            )}
            <p className="text-3xl font-extrabold text-cr-text">{records.streak.count}</p>
          </div>
          <p className={`text-sm font-bold mt-2 ${records.streak.type === "win" ? "text-cr-win" : "text-cr-loss"}`}>
            {records.streak.type === "win" ? "побед подряд" : "поражений подряд"}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-cr-win" />
            <span className="text-label">Лучший бой</span>
          </div>
          <p className="text-2xl font-extrabold text-cr-win">
            {records.bestGain > 0 ? `+${records.bestGain}` : "—"}
          </p>
          <p className="text-xs text-cr-accent font-semibold mt-1">трофеев за один бой</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-cr-loss" />
            <span className="text-label">Худший бой</span>
          </div>
          <p className="text-2xl font-extrabold text-cr-loss">
            {records.worstLoss < 0 ? records.worstLoss : "—"}
          </p>
          <p className="text-xs text-cr-accent font-semibold mt-1">трофеев за один бой</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ElixirIcon size={18} />
            <span className="text-label">Ср. эликсир</span>
          </div>
          <p className="text-2xl font-extrabold text-cr-text">
            {stats.avg_elixir > 0 ? stats.avg_elixir.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-cr-accent font-semibold mt-1">ваших колод</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-cr-blue" />
            <span className="text-label">Ср. время</span>
          </div>
          <p className="text-2xl font-extrabold text-cr-text">
            {stats.avg_time ? formatDuration(stats.avg_time) : "—"}
          </p>
          <p className="text-xs text-cr-accent font-semibold mt-1">длительность боя</p>
        </Card>

        <Card className="col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-cr-gold" />
            <span className="text-label">Макс. кубки</span>
          </div>
          <p className="text-2xl font-extrabold text-cr-gold">
            {stats.max_trophies ? formatNumber(stats.max_trophies) : "—"}
          </p>
          <p className="text-xs text-cr-accent font-semibold mt-1">лучший результат в истории</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-cr-gold" />
          <h3 className="text-sm font-bold text-cr-text">Лента последних боёв</h3>
        </div>
        <p className="text-xs text-cr-accent font-medium mb-3">
          Изменение трофеев — зелёный выигрыш, красный проигрыш
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {(stats.last_results ?? []).slice(0, 24).map((r, i) => (
            <div
              key={i}
              className={
                "min-w-[2.25rem] h-8 px-1.5 rounded-lg flex items-center justify-center text-[10px] font-extrabold " +
                (r.won ? "bg-cr-win/20 text-cr-win border border-cr-win/30" : "bg-cr-loss/20 text-cr-loss border border-cr-loss/30")
              }
              title={r.won ? "Победа" : "Поражение"}
            >
              {r.trophy_change >= 0 ? "+" : ""}{r.trophy_change}
            </div>
          ))}
          {!stats.last_results?.length && (
            <p className="text-sm text-cr-accent">Нет данных о боях</p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-cr-blue" />
          <h3 className="text-sm font-bold text-cr-text">Совет</h3>
        </div>
        <p className="text-sm text-cr-accent font-medium leading-relaxed">
          Подробные графики, карты и разбор матчапов — во вкладке{" "}
          <span className="text-cr-gold font-bold">Аналитика</span>.
          Здесь только персональные рекорды и серии.
        </p>
      </Card>
    </div>
  );
}

export { StatsPage as default };
