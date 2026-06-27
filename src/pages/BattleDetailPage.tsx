import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Clock,
  Zap,
  ChevronRight,
  Copy,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Loader, LinearProgress } from "@/components/ui";
import { api } from "@/api/client";
import { BattleDetail } from "@/types";
import { formatTime, getTrophyChangeColor } from "@/utils";

export function BattleDetailPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const b = await api.getBattle(Number(index));
        setBattle(b);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [index]);

  if (loading) return <Loader />;
  if (!battle) return <Card className="text-center">Бой не найден</Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="!p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-cr-text">Детали боя</h1>
          <p className="text-sm text-cr-muted">vs {battle.opponent_name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={
          "flex items-center gap-2 px-4 py-2 rounded-xl " +
          (battle.won ? "bg-cr-win/10 text-cr-win" : "bg-cr-loss/10 text-cr-loss")
        }>
          <Trophy className="w-5 h-5" />
          <span className="font-bold">{battle.won ? "Победа" : "Поражение"}</span>
        </div>
        <div className={getTrophyChangeColor(battle.trophy_change)}>
          {battle.trophy_change >= 0 ? "+" : ""}{battle.trophy_change} 🏆
        </div>
        <div className="text-cr-muted text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatTime(battle.duration)}
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-cr-gold" />
          <h3 className="font-semibold text-cr-text">Причины исхода</h3>
        </div>
        <ul className="space-y-2">
          {battle.reasons.map((reason, i) => (
            <li key={i} className="text-sm text-cr-muted flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cr-gold mt-2 flex-shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </Card>

      {battle.opponent_threats.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-cr-loss" />
            <h3 className="font-semibold text-cr-text">Угрозы противника</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {battle.opponent_threats.map((threat, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg bg-cr-loss/10 border border-cr-loss/20 text-xs text-cr-loss"
              >
                {threat}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-semibold text-cr-text mb-4">Ваша колода</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {battle.user_deck.map((card, i) => (
              <div key={i} className="aspect-square rounded-xl bg-cr-bg/60 border border-cr-border flex items-center justify-center text-2xl">
                🃏
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cr-muted">Ср. эликсир</span>
              <span className="font-semibold text-cr-text">{battle.user_stats.avg_elixir.toFixed(1)}</span>
            </div>
            <LinearProgress value={battle.user_stats.avg_elixir} max={5} color="#60a5fa" showLabel={false} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-cr-text mb-4">Колода противника</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {battle.opponent_deck.map((card, i) => (
              <div key={i} className="aspect-square rounded-xl bg-cr-bg/60 border border-cr-border flex items-center justify-center text-2xl">
                🃏
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cr-muted">Ср. эликсир</span>
              <span className="font-semibold text-cr-text">{battle.opponent_stats.avg_elixir.toFixed(1)}</span>
            </div>
            <LinearProgress value={battle.opponent_stats.avg_elixir} max={5} color="#ef4444" showLabel={false} />
          </div>
        </Card>
      </div>

      {battle.best_moment && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Лучший момент</h3>
          </div>
          <p className="text-sm text-cr-muted">{battle.best_moment}</p>
        </Card>
      )}
    </div>
  );
}

export { BattleDetailPage as default };