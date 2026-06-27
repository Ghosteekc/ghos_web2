import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Flame,
  Target,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Loader, SkeletonGroup } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";
import { api } from "@/api/client";
import { BattleSummary } from "@/types";

export function BattlesPage() {
  const navigate = useNavigate();
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  const load = async () => {
    try {
      const res = await api.getBattles();
      setBattles(res.battles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const filtered = battles.filter((b) => {
    if (filter === "wins") return b.won;
    if (filter === "losses") return !b.won;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cr-text tracking-tight">История боёв</h1>
        <Button variant="ghost" onClick={onRefresh} className="!p-2" disabled={refreshing}>
          <RefreshCw className={"w-5 h-5 " + (refreshing ? "animate-spin" : "")} />
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "wins", "losses"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 " +
              (filter === f
                ? "bg-cr-gold text-cr-bg shadow-glow"
                : "bg-cr-card text-cr-muted hover:text-cr-text border border-cr-border")
            }
          >
            {f === "all" ? "Все" : f === "wins" ? "Победы" : "Поражения"}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGroup count={5} />
      ) : (
        <div className="space-y-4">
          {filtered.map((battle, i) => (
            <BattleCardSimple key={battle.index} summary={battle} index={i} onOpen={() => navigate(`/battles/${battle.index}`)} />
          ))}
          {filtered.length === 0 && (
            <Card className="text-center">
              <Trophy className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
              <p className="text-cr-muted">Бои не найдены</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export { BattlesPage as default };