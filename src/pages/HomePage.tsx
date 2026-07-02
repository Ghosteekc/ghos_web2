import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { Profile, BattleSummary, StatsOverview } from "@/types";
import { usePageRefresh } from "@/hooks";
import { PlayerCard, StatsGrid } from "@/components/home";
import { Card, Button, SkeletonGroup } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";

export function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partialWarning, setPartialWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPartialWarning(null);
    try {
      setError(null);
      const data = await api.getHome();
      setProfile(data.profile);
      setBattles(data.battles ?? []);
      setStats(data.stats);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Ошибка загрузки";
      try {
        const p = await api.getProfile();
        setProfile(p);
        setBattles([]);
        setStats(null);
        setPartialWarning(msg);
        setError(null);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonGroup count={2} />
        <SkeletonGroup count={1} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-2">{error ?? "Ошибка загрузки"}</p>
        <p className="text-xs text-cr-muted mb-4">
          Проверьте, что бот и localtunnel запущены. Потяните вниз для обновления.
        </p>
        <Button onClick={() => void load()}>Повторить</Button>
      </Card>
    );
  }

  const lastBattle = battles[0];
  const lastResult = lastBattle
    ? lastBattle.won
      ? `Победа над ${lastBattle.opponent_name}`
      : `Поражение от ${lastBattle.opponent_name}`
    : "Нет данных";

  return (
    <div className="space-y-6">
      {partialWarning && (
        <Card className="!py-3 !px-4 border-cr-gold/30 bg-cr-gold/5">
          <p className="text-xs text-cr-muted">{partialWarning}</p>
          <p className="text-xs text-cr-gold mt-1">Профиль загружен. Бои и статистика подгрузятся позже.</p>
        </Card>
      )}

      <PlayerCard profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="cursor-pointer group" onClick={() => navigate("/battles")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-cr-muted mb-1">Последний бой</p>
              <p className="text-sm font-semibold text-cr-text">{lastResult}</p>
              {lastBattle && (
                <p className={"text-xs mt-1 " + (lastBattle.won ? "text-cr-win" : "text-cr-loss")}>
                  {lastBattle.won ? "+" : ""}{lastBattle.trophy_change} 🏆
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-cr-blue/10 group-hover:bg-cr-blue/20 transition-colors">
              <ArrowUpRight className="w-5 h-5 text-cr-blue" />
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer group" onClick={() => navigate("/analytics")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-cr-muted mb-1">Аналитика</p>
              <p className="text-sm font-semibold text-cr-text">
                {stats
                  ? `${stats.winrate.toFixed(1)}% за ${stats.total_battles ?? stats.wins + stats.losses} боёв`
                  : "—"}
              </p>
              <p className="text-xs text-cr-muted mt-1">Откройте подробный дашборд</p>
            </div>
            <div className="p-3 rounded-xl bg-cr-gold/10 group-hover:bg-cr-gold/20 transition-colors">
              <ChevronRight className="w-5 h-5 text-cr-gold" />
            </div>
          </div>
        </Card>
      </div>

      {stats && <StatsGrid stats={stats} />}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cr-text">Последние бои</h3>
          <Button variant="ghost" onClick={() => navigate("/battles")} className="!px-3 !py-1.5 text-xs">
            Все <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {battles.length > 0 ? (
            battles.slice(0, 3).map((battle, i) => (
              <BattleCardSimple
                key={battle.index}
                summary={battle}
                index={i}
                onOpen={() => navigate(`/battles/${battle.index}`)}
              />
            ))
          ) : (
            <Card className="text-center text-cr-muted text-sm">
              История боёв пуста. Убедитесь, что подписка активна и тег привязан.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export { HomePage as default };
