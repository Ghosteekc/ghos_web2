import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Flame,
  Target,
  Swords,
  Clock,
} from "lucide-react";
import { Card, Loader, Skeleton } from "@/components/ui";
import { api } from "@/api/client";
import { StatsOverview } from "@/types";
import { formatNumber } from "@/utils";

export function StatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await api.getStats();
        setStats(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <Card className="text-center">Нет данных</Card>;

  const topCards = stats.most_used_cards.slice(0, 6);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-cr-text tracking-tight">Статистика</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего боёв", value: formatNumber(stats.total_battles), icon: Swords, color: "text-cr-blue" },
          { label: "Победы", value: stats.wins, icon: TrendingUp, color: "text-cr-win" },
          { label: "Поражения", value: stats.losses, icon: Flame, color: "text-cr-loss" },
          { label: "Винрейт", value: `${stats.winrate.toFixed(1)}%`, icon: Target, color: "text-cr-gold" },
        ].map((stat, i) => (
          <Card key={i}>
            <stat.icon className={"w-6 h-6 mb-2 " + stat.color} />
            <p className="text-2xl font-bold text-cr-text">{stat.value}</p>
            <p className="text-xs text-cr-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-cr-text mb-4">Самые используемые карты</h3>
        <div className="space-y-3">
          {topCards.map((card, i) => (
            <div key={card.name} className="flex items-center gap-3">
              <span className="text-xs text-cr-muted w-4">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-cr-text">{card.name}</span>
                  <span className="text-xs text-cr-muted">{card.count} игр · {card.winrate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-cr-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-cr-blue to-cr-gold origin-left"
                    style={{ width: `${Math.min((card.count / (topCards[0].count || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-cr-blue" />
            <h3 className="text-sm font-semibold text-cr-text">Winrate по времени суток</h3>
          </div>
          <div className="space-y-2">
            {stats.winrate_by_hour.slice(0, 10).map((hour, i) => (
              <div key={hour.hour} className="flex items-center gap-3">
                <span className="text-xs text-cr-muted w-8">{hour.hour}:00</span>
                <div className="flex-1 h-2 bg-cr-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cr-win"
                    style={{ width: `${(hour.wins / (hour.total || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-cr-muted w-10 text-right">
                  {((hour.wins / (hour.total || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-cr-gold" />
            <h3 className="text-sm font-semibold text-cr-text">Последние результаты</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {stats.last_results.slice(-20).map((r, i) => (
              <div
                key={i}
                className={
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold " +
                  (r.won ? "bg-cr-win/20 text-cr-win" : "bg-cr-loss/20 text-cr-loss")
                }
              >
                {r.won ? "+" : ""}{r.trophy_change}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export { StatsPage as default };