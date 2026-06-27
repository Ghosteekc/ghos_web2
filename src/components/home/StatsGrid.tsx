import { motion } from "framer-motion";
import { Trophy, Swords, CircleDot, FlaskConical, Timer, Flame, Target } from "lucide-react";
import { formatNumber, getWinColor, cn } from "@/utils";
import { Skeleton } from "@/components/ui";

interface StatsGridProps {
  stats?: {
    total_battles: number;
    wins: number;
    losses: number;
    draws: number;
    winrate: number;
    avg_elixir: number;
    max_trophies: number;
  };
  loading?: boolean;
}

const statItems = [
  { key: "total_battles", icon: Swords, label: "Всего боёв", format: (v: number) => v },
  { key: "wins", icon: Trophy, label: "Победы", format: (v: number) => v },
  { key: "losses", icon: Flame, label: "Поражения", format: (v: number) => v },
  { key: "draws", icon: CircleDot, label: "Ничьи", format: (v: number) => v },
  { key: "avg_elixir", icon: FlaskConical, label: "Ср. эликсир", format: (v: number) => v.toFixed(1) },
  { key: "max_trophies", icon: Target, label: "Макс. кубки", format: (v: number) => formatNumber(v) },
  { key: "winrate", icon: Timer, label: "Винрейт", format: (v: number) => `${v.toFixed(1)}%` },
  { key: "avg_time", icon: Timer, label: "Ср. время", format: (v: number) => `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}` },
];

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="glass-card p-4 hover:shadow-glow transition-all duration-300"
        >
          <item.icon className="w-6 h-6 text-cr-blue mb-3" />
          <p className="text-xs text-cr-muted mb-1">{item.label}</p>
          <p
            className={cn(
              "text-xl font-bold",
              item.key === "winrate" && getWinColor(stats?.[item.key as keyof typeof stats] as number)
            )}
          >
            {stats?.[item.key as keyof typeof stats] !== undefined
              ? item.format(stats[item.key as keyof typeof stats] as number)
              : "—"}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

export { StatsGrid as default };