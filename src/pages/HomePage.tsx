import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { api } from "@/api/client";
import { Profile, BattleSummary, StatsOverview } from "@/types";
import { useTelegram } from "@/hooks";
import { PlayerCard, StatsGrid } from "@/components/home";
import { Card, Button, Loader, SkeletonGroup } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";

export function HomePage() {
  const { tg } = useTelegram();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, b, s] = await Promise.all([
          api.getProfile(),
          api.getBattles(),
          api.getStats(),
        ]);
        setProfile(p);
        setBattles(b.battles);
        setStats(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonGroup count={2} />
        <SkeletonGroup count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Повторить</Button>
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
      <PlayerCard profile={profile!} />

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
                {stats ? `${stats.winrate.toFixed(1)}% за ${stats.total_battles} боёв` : "—"}
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
          {battles.slice(0, 3).map((battle, i) => (
            <BattleCardSimple
              key={battle.index}
              summary={battle}
              index={i}
              onOpen={() => navigate(`/battles/${battle.index}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { HomePage as default };