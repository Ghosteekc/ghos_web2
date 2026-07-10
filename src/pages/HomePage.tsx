import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { BattleSummary, Profile, StatsOverview } from "@/types";
import { usePageRefresh } from "@/hooks";
import { PlayerCard, HomeServicePanel, SupercellDisclaimer } from "@/components/home";
import { Card, Button, Loader } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";
import { battleDetailPath } from "@/utils";
import { cacheHas } from "@/api/cache";

export function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastBattle, setLastBattle] = useState<BattleSummary | null>(null);
  const [todayStats, setTodayStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(() => !cacheHas("home"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getHome();
      setProfile(data.profile);
      setLastBattle(data.battles[0] ?? null);
      setTodayStats(data.stats);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
    api.prefetchDeckTabs();
  }, [load]);

  if (loading) {
    return <Loader />;
  }

  if (error || !profile) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-2">{error ?? "Ошибка загрузки"}</p>
        <p className="text-xs text-cr-muted mb-4">
          Нет связи с сервером. Потяните вниз для обновления.
        </p>
        <Button onClick={() => void load()}>Повторить</Button>
      </Card>
    );
  }

  const todayRow = todayStats?.winrate_by_day?.slice(-1)[0];

  return (
    <div className="space-y-6">
      <PlayerCard profile={profile} />

      {todayRow && todayRow.wins + todayRow.losses > 0 && (
        <Card className="border-cr-blue/20">
          <p className="text-xs text-cr-muted uppercase tracking-wide mb-3">Сегодня</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-[11px] text-cr-muted mb-0.5">Победы</p>
                <p className="font-bold text-cr-win tabular-nums">{todayRow.wins}</p>
              </div>
              <div className="w-px h-8 bg-cr-border/60" aria-hidden />
              <div>
                <p className="text-[11px] text-cr-muted mb-0.5">Поражения</p>
                <p className="font-bold text-cr-loss tabular-nums">{todayRow.losses}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-cr-muted mb-0.5">Винрейт</p>
              <p className={`font-bold tabular-nums ${todayRow.winrate >= 50 ? "text-cr-win" : "text-cr-loss"}`}>
                {todayRow.winrate.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {lastBattle && (
        <div>
          <h3 className="text-sm font-semibold text-cr-text mb-3 px-1">Последний бой</h3>
          <BattleCardSimple
            summary={lastBattle}
            index={0}
            onOpen={() => navigate(battleDetailPath(lastBattle.timestamp, lastBattle.index))}
          />
        </div>
      )}

      <HomeServicePanel profile={profile} onNavigate={navigate} />
      <SupercellDisclaimer />
    </div>
  );
}

export { HomePage as default };
