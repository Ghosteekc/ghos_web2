import { useCallback, useEffect, useState } from "react";
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
import { api, ApiError } from "@/api/client";
import { BattleSummary } from "@/types";
import { usePageRefresh } from "@/hooks";

export function BattlesPage() {
  const navigate = useNavigate();
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getBattles();
      setBattles(res.battles ?? []);
    } catch (e) {
      setBattles([]);
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки боёв");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

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
        <h1 className="page-title">История боёв</h1>
        <Button variant="ghost" onClick={onRefresh} className="!p-2" disabled={refreshing}>
          <RefreshCw className={"w-5 h-5 " + (refreshing ? "animate-spin" : "")} />
        </Button>
      </div>

      <div className="filter-tab-row">
        {(["all", "wins", "losses"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={"filter-tab " + (filter === f ? "filter-tab--active" : "")}
          >
            {f === "all" ? "Все" : f === "wins" ? "Победы" : "Поражения"}
          </button>
        ))}
      </div>

      {error && (
        <Card className="text-center text-cr-loss text-sm">{error}</Card>
      )}

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