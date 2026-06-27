import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Flame, Target, Clock } from "lucide-react";
import { StatsOverview } from "@/types";
import { formatNumber, getWinColor } from "@/utils";
import { Card } from "@/components/ui";

const COLORS = ["#fbbf24", "#60a5fa", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899"];

interface AnalyticsProps {
  stats?: StatsOverview;
  loading?: boolean;
}

export function Analytics({ stats, loading }: AnalyticsProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-[280px]">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const lastResults = useMemo(() => {
    return stats.last_results.slice(-14).map((r, i) => ({
      name: `Бой ${i + 1}`,
      rate: r.trophy_change,
      won: r.won,
    }));
  }, [stats.last_results]);

  const winrateByDay = useMemo(() => {
    return stats.winrate_by_day.map((d) => ({
      date: new Date(d.date).toLocaleDateString("ru", { day: "numeric", month: "short" }),
      wins: d.wins,
      losses: d.losses,
    }));
  }, [stats.winrate_by_day]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cr-text tracking-tight">Аналитика</h1>
        <p className="text-sm text-cr-muted mt-1">Подробная статистика по вашим боям</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего боёв", value: stats.total_battles, icon: Flame, color: "text-cr-gold" },
          { label: "Победы", value: stats.wins, icon: TrendingUp, color: "text-cr-win" },
          { label: "Поражения", value: stats.losses, icon: Target, color: "text-cr-loss" },
          { label: "Винрейт", value: `${stats.winrate.toFixed(1)}%`, icon: Clock, color: "text-cr-blue" },
        ].map((item, i) => (
          <Card key={i} className="text-center">
            <item.icon className={"w-6 h-6 mx-auto mb-2 " + item.color} />
            <p className="text-2xl font-bold text-cr-text">{item.value}</p>
            <p className="text-xs text-cr-muted">{item.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Рост трофеев</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lastResults}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ fill: "#fbbf24", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Winrate по дням</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winrateByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
                <Bar dataKey="wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Любимые карты</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.most_used_cards.slice(0, 6)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#9ca3af" }}
                >
                  {stats.most_used_cards.slice(0, 6).map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      stroke="none"
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Архетипы</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={stats.archetypes}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <PolarRadiusAxis stroke="#9ca3af" fontSize={12} />
                <Radar
                  name="Использование"
                  dataKey="value"
                  stroke="#60a5fa"
                  fill="#60a5fa"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export { Analytics as default };

import { Skeleton } from "@/components/ui";