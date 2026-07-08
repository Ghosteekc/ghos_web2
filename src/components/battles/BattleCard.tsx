import { motion } from "framer-motion";
import {
  Trophy,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatTime, getTrophyChangeColor, cn, formatBattlePlayedAt } from "@/utils";
import { BattleSummary } from "@/types";
import { Card, ElixirIcon } from "@/components/ui";
import { CardTile } from "@/components/cards";

interface BattleCardSimpleProps {
  summary: BattleSummary;
  onOpen: () => void;
  index: number;
}

export function BattleCardSimple({ summary, onOpen, index }: BattleCardSimpleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card hover delay={index * 0.05} className="cursor-pointer group relative overflow-hidden" onClick={onOpen}>
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            summary.won ? "bg-cr-win" : "bg-cr-loss",
          )}
        />
        <div className="pl-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {summary.won ? (
                <Trophy className="w-5 h-5 text-cr-win" />
              ) : (
                <Flame className="w-5 h-5 text-cr-loss" />
              )}
              <span className={cn("font-semibold text-sm", summary.won ? "text-cr-win" : "text-cr-loss")}>
                {summary.won ? "Победа" : "Поражение"}
              </span>
            </div>
            <span className={cn("text-sm font-bold", getTrophyChangeColor(summary.trophy_change))}>
              {summary.trophy_change >= 0 ? "+" : ""}{summary.trophy_change} 🏆
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-cr-text">против {summary.opponent_name}</p>
              <p className="text-xs text-cr-muted">#{summary.opponent_tag || "—"}</p>
            </div>
            <div className="text-right">
              {formatBattlePlayedAt(summary.timestamp, summary.played_at) ? (
                <p className="text-xs font-semibold text-cr-accent">
                  {formatBattlePlayedAt(summary.timestamp, summary.played_at)}
                </p>
              ) : null}
              <p className="text-xs text-cr-muted">{formatTime(summary.duration ?? 0)}</p>
              <p className="text-xs text-cr-muted flex items-center gap-1 justify-end">
                <ElixirIcon size={12} />
                {(summary.avg_elixir ?? 0).toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="grid grid-cols-4 gap-1 flex-1 max-w-[11rem]">
              {(summary.user_deck ?? []).slice(0, 8).map((name, i) => (
                <CardTile key={`${name}-${i}`} name={name} size="xs" />
              ))}
            </div>
            <motion.div
              whileHover={{ x: 4 }}
              className="text-cr-muted group-hover:text-cr-gold transition-colors shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>

          {summary.top_reason ? (
            <p className="text-xs text-cr-muted mt-3 leading-snug line-clamp-2">{summary.top_reason}</p>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
