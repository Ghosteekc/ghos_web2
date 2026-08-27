import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  RefreshCw,
} from "lucide-react";
import { Button, Loader, ScrollToTopButton, ErrorState, EmptyState, PageHeader } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";
import { api, ApiError } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import { BattleSummary } from "@/types";
import { battleDetailPath, cn } from "@/utils";
import { usePageRefresh } from "@/hooks";

type BattlesPayload = {
  battles: BattleSummary[];
  cached_total: number | null;
  cached_winrate: number | null;
};

const BATTLES_CACHE_KEY = "battles-v5";

export function BattlesPage() {
  const navigate = useNavigate();
  const [battles, setBattles] = useState<BattleSummary[]>(() => {
    const hit = cacheGet<BattlesPayload>(BATTLES_CACHE_KEY);
    return hit?.battles ?? [];
  });
  const [loading, setLoading] = useState(() => !cacheHas(BATTLES_CACHE_KEY));
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "wins" | "losses" | "league">("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      let res = await api.getBattles();
      // New / cold users: auto-pull CR battlelog once before showing empty.
      if (!(res.battles ?? []).length) {
        setRefreshing(true);
        try {
          await api.syncData();
          res = await api.getBattles();
        } catch {
          // keep first response / error below
        }
      }
      setBattles(res.battles ?? []);
    } catch (e) {
      if (!cacheHas(BATTLES_CACHE_KEY)) {
        setBattles([]);
      }
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки боёв");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.syncData();
      const res = await api.getBattles();
      setBattles(res.battles ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось синхронизировать");
    } finally {
      setRefreshing(false);
    }
  }, []);

  usePageRefresh(onRefresh);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      battles.filter((b) => {
        if (filter === "wins") return b.won;
        if (filter === "losses") return !b.won;
        if (filter === "league") return Boolean(b.is_ranked);
        return true;
      }),
    [battles, filter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="История боёв"
        subtitle={
          <p className="wallpaper-plain-text text-sm">
            Кнопка обновления подтягивает свежие бои из Clash Royale
          </p>
        }
        action={
          <Button
            variant="ghost"
            onClick={() => void onRefresh()}
            className="!p-2"
            disabled={refreshing}
            aria-label="Синхронизировать"
          >
            <RefreshCw className={"w-5 h-5 " + (refreshing ? "animate-spin" : "")} />
          </Button>
        }
      />

      <div className="filter-tab-row">
        {(["all", "wins", "losses", "league"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn("filter-tab", filter === f && "filter-tab--active pixel-btn--active")}
            aria-pressed={filter === f}
          >
            {f === "all" ? "Все" : f === "wins" ? "Победы" : f === "losses" ? "Поражения" : "Лига"}
          </button>
        ))}
      </div>

      {error && <ErrorState title={error} />}

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4 battles-list">
          {filtered.map((battle) => (
            <BattleCardSimple
              key={`${battle.timestamp}-${battle.index}`}
              summary={battle}
              onOpen={() => navigate(battleDetailPath(battle.timestamp, battle.index))}
            />
          ))}
          {filtered.length === 0 && (
            <EmptyState
              icon={<Trophy className="h-12 w-12 opacity-50" />}
              title={
                refreshing
                  ? "Загружаем бои из Clash Royale…"
                  : filter === "league"
                    ? "Боёв в лиге нет"
                    : "Бои пока не найдены"
              }
              description={
                refreshing || filter === "league"
                  ? undefined
                  : "Нажмите обновление — подтянем последние бои из игры."
              }
            />
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && <ScrollToTopButton />}
    </div>
  );
}

export { BattlesPage as default };
