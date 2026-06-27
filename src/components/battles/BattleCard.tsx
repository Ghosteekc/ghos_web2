import { motion } from "framer-motion";
import {
  Trophy,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";
import { formatTime, getTrophyChangeColor, cn } from "@/utils";
import { BattleSummary } from "@/types";
import { Card } from "@/components/ui";

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
        <Card hover delay={index * 0.05} className="cursor-pointer group relative overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            summary.won ? "bg-cr-win" : "bg-cr-loss"
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

          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-cr-text">vs {summary.opponent_name}</p>
              <p className="text-xs text-cr-muted">#{summary.opponent_tag}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-cr-muted">{formatTime(summary.duration)}</p>
              <p className="text-xs text-cr-muted flex items-center gap-1 justify-end">
                <Zap className="w-3 h-3" />
                {summary.avg_elixir.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {summary.user_deck.slice(0, 4).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg bg-cr-surface border border-cr-border flex items-center justify-center text-xs"
                >
                  🃏
                </div>
              ))}
              {summary.user_deck.length > 4 && (
                <div className="w-8 h-8 rounded-lg bg-cr-surface border border-cr-border flex items-center justify-center text-xs text-cr-muted">
                  +{summary.user_deck.length - 4}
                </div>
              )}
            </div>
            <motion.div
              whileHover={{ x: 4 }}
              className="text-cr-muted group-hover:text-cr-gold transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}