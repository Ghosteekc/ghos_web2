import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Clock,
  AlertTriangle,
  Shield,
  Swords,
  Target,
  GitCompareArrows,
  UserRound,
  Crosshair,
  Gauge,
  Map,
} from "lucide-react";
import { Card, Button, Loader, LinearProgress, ErrorState, PageHeader } from "@/components/ui";
import { CardTile, PlayerDeckGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { BattleDetail, ElixirEfficiency, MatchDifficulty, MatchPlan, TacticalMatchup } from "@/types";
import { formatTime, getTrophyChangeColor, formatPlayerTag } from "@/utils";
import { buildDeckComparePath } from "@/utils/deckActions";
import { usePageRefresh } from "@/hooks";

function KeyCardsBlock({
  title,
  items,
  accent,
}: {
  title: string;
  items: { name: string; name_ru: string; note: string }[];
  accent: "win" | "loss";
}) {
  if (!items.length) return null;
  const border = accent === "win" ? "border-cr-win/25 bg-cr-win/5" : "border-cr-loss/25 bg-cr-loss/5";
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Target className={`w-5 h-5 ${accent === "win" ? "text-cr-win" : "text-cr-loss"}`} />
        <h3 className="font-semibold text-cr-text">{title}</h3>
      </div>
      <p className="text-xs text-cr-muted mb-3">
        Оценка по колоде — точный урон по картам в статистике не показывается.
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className={`rounded-xl border p-3 ${border}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 shrink-0">
                <CardTile name={item.name} size="sm" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-cr-text">{item.name_ru}</p>
                <p className="text-sm text-cr-muted leading-snug">{item.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TipList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-cr-text mb-2">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((line, i) => (
          <li key={i} className="text-sm text-cr-muted flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cr-gold mt-1.5 flex-shrink-0" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TacticalMatchupBlock({ data }: { data: TacticalMatchup }) {
  const hasPhases = data.early_game.length + data.mid_game.length + data.late_game.length > 0;
  const hasTips =
    data.pressure_points.length +
      data.critical_interactions.length +
      data.best_openings.length +
      data.worst_mistakes.length +
      data.danger_cards.length >
    0;
  if (!hasPhases && !hasTips) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-5 h-5 text-cr-gold" />
        <h3 className="font-semibold text-cr-text">Тактический разбор матчапа</h3>
      </div>
      <p className="text-xs text-cr-muted mb-4">
        Выводы только из состава двух колод: роли, контры, синергии и планы игры.
      </p>
      <div className="space-y-4">
        {hasPhases ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TipList title="Ранняя игра" items={data.early_game} />
            <TipList title="Мид" items={data.mid_game} />
            <TipList title="Дабл-эликсир" items={data.late_game} />
          </div>
        ) : null}
        <TipList title="Ключевые взаимодействия" items={data.critical_interactions} />
        <TipList title="Точки давления" items={data.pressure_points} />
        <TipList title="Лучшие открытия" items={data.best_openings} />
        <TipList title="Грубые ошибки" items={data.worst_mistakes} />
        {data.danger_cards.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold text-cr-text mb-2">Опасные карты</h4>
            <div className="space-y-2">
              {data.danger_cards.map((card) => (
                <div
                  key={card.name}
                  className="rounded-xl border border-cr-loss/25 bg-cr-loss/5 p-3 flex items-center gap-3"
                >
                  <div className="w-12 shrink-0">
                    <CardTile name={card.name} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cr-text">{card.name_ru}</p>
                    <p className="text-sm text-cr-muted leading-snug">{card.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

const ELIXIR_METRICS: { key: keyof ElixirEfficiency; label: string }[] = [
  { key: "cheap_rotation", label: "Дешёвая ротация" },
  { key: "punish_speed", label: "Скорость наказания" },
  { key: "recovery_speed", label: "Восстановление" },
  { key: "double_elixir_power", label: "Дабл-эликсир" },
  { key: "overtime_strength", label: "Овертайм" },
];

function ElixirEfficiencyCard({ title, data }: { title: string; data: ElixirEfficiency }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-5 h-5 text-cr-gold shrink-0" />
          <h3 className="font-semibold text-cr-text truncate">{title}</h3>
        </div>
        <span className="text-xs font-semibold text-cr-accent shrink-0 px-2 py-1 rounded-lg bg-cr-accent/10 border border-cr-accent/20">
          {data.elixir_profile}
        </span>
      </div>
      <p className="text-xs text-cr-muted mb-3">
        Только состав колоды · ср. {data.average_cost.toFixed(1)} · цикл {data.effective_cycle}
      </p>
      <div className="space-y-2 mb-3">
        {ELIXIR_METRICS.map(({ key, label }) => {
          const value = Number(data[key]) || 0;
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-cr-muted">{label}</span>
                <span className="text-cr-text font-medium">{value}</span>
              </div>
              <LinearProgress value={value} max={100} color="#fbbf24" showLabel={false} />
            </div>
          );
        })}
      </div>
      {data.explanations.length > 0 ? (
        <ul className="space-y-1.5">
          {data.explanations.map((line, i) => (
            <li key={i} className="text-sm text-cr-muted flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cr-gold mt-1.5 flex-shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function difficultyAccent(rating: string): string {
  if (rating === "Очень лёгкий" || rating === "Лёгкий") return "text-cr-win";
  if (rating === "Сложный" || rating === "Очень сложный") return "text-cr-loss";
  return "text-cr-gold";
}

function MatchDifficultyBlock({ data }: { data: MatchDifficulty }) {
  if (!data.reasons.length && data.difficulty === 50) return null;
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${difficultyAccent(data.rating)}`} />
          <h3 className="font-semibold text-cr-text">Сложность матчапа</h3>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${difficultyAccent(data.rating)}`}>
            {data.difficulty}
          </p>
          <p className={`text-sm font-semibold ${difficultyAccent(data.rating)}`}>{data.rating}</p>
        </div>
      </div>
      <p className="text-xs text-cr-muted mb-3">
        Оценка по составу колод: контры, цикл, здания, воздух, спеллы и win-conditions.
      </p>
      <LinearProgress value={data.difficulty} max={100} color="#f87171" showLabel={false} />
      {data.reasons.length > 0 ? (
        <ul className="space-y-1.5 mt-4">
          {data.reasons.map((line, i) => (
            <li key={i} className="text-sm text-cr-muted flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cr-gold mt-1.5 flex-shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function MatchPlanBlock({ data }: { data: MatchPlan }) {
  const gp = data.game_plan;
  const hasPhases = gp.phase_1.length + gp.phase_2.length + gp.phase_3.length > 0;
  if (!hasPhases && !data.avoid.length && !data.save_cards.length && !data.win_condition_window) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Map className="w-5 h-5 text-cr-gold" />
        <h3 className="font-semibold text-cr-text">План на матчап</h3>
      </div>
      <p className="text-xs text-cr-muted mb-4">
        Уникальный план из состава колод, GamePlan и тактических взаимодействий.
      </p>
      <div className="space-y-4">
        {hasPhases ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TipList title="Phase 1 — начало" items={gp.phase_1} />
            <TipList title="Phase 2 — преимущество" items={gp.phase_2} />
            <TipList title="Phase 3 — финиш" items={gp.phase_3} />
          </div>
        ) : null}
        {data.win_condition_window ? (
          <div className="rounded-xl border border-cr-accent/25 bg-cr-accent/5 p-3">
            <h4 className="text-sm font-semibold text-cr-text mb-1">Окно атаки</h4>
            <p className="text-sm text-cr-muted leading-snug">{data.win_condition_window}</p>
          </div>
        ) : null}
        <TipList title="Категорически нельзя" items={data.avoid} />
        {data.save_cards.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold text-cr-text mb-2">Не трать зря</h4>
            <div className="space-y-2">
              {data.save_cards.map((card) => (
                <div
                  key={card.name}
                  className="rounded-xl border border-cr-border/40 bg-cr-border/10 p-3 flex items-center gap-3"
                >
                  <div className="w-12 shrink-0">
                    <CardTile name={card.name} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cr-text">{card.name_ru}</p>
                    <p className="text-sm text-cr-muted leading-snug">{card.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function BattleDetailPage() {
  const { index, battleTime } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    typeof (location.state as { from?: unknown } | null)?.from === "string"
      ? (location.state as { from: string }).from
      : null;
  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      let b: BattleDetail;
      if (battleTime) {
        b = await api.getBattleByTime(decodeURIComponent(battleTime));
      } else if (index !== undefined && index !== "") {
        b = await api.getBattle(Number(index));
      } else {
        throw new Error("Бой не указан");
      }
      setBattle(b);
    } catch (e) {
      setBattle(null);
      setError(e instanceof ApiError ? e.message : "Бой не найден");
    } finally {
      setLoading(false);
    }
  }, [index, battleTime]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const opponentTagClean = useMemo(() => {
    const raw = (battle?.opponent_tag || "").trim();
    return raw.replace(/^#/, "");
  }, [battle?.opponent_tag]);

  const comparePath = useMemo(() => {
    if (!battle) return "";
    const cards =
      battle.opponent_deck_cards?.length === 8
        ? battle.opponent_deck_cards
        : battle.opponent_deck;
    return buildDeckComparePath(
      cards,
      battle.opponent_name || "Соперник",
      location.pathname || "/battles",
    );
  }, [battle, location.pathname]);

  if (loading) return <Loader />;
  if (!battle) {
    return (
      <ErrorState
        title={error ?? "Бой не найден"}
        button="К истории"
        onAction={() => navigate("/battles")}
      />
    );
  }

  const detailReasons = battle.reasons.length > 1 ? battle.reasons.slice(1) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Детали боя"
        subtitle={
          <div className="space-y-0.5">
            {opponentTagClean ? (
              <button
                type="button"
                onClick={() => navigate(`/player/${opponentTagClean}`)}
                className="text-base text-cr-gold hover:underline font-medium"
              >
                против {battle.opponent_name}
              </button>
            ) : (
              <p className="text-base text-cr-muted">против {battle.opponent_name}</p>
            )}
            {opponentTagClean ? (
              <p className="text-sm text-cr-muted">{formatPlayerTag(opponentTagClean)}</p>
            ) : null}
          </div>
        }
        action={
          <Button variant="ghost" onClick={goBack} className="!p-2" aria-label="Назад">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {opponentTagClean ? (
          <Button
            variant="secondary"
            className="!py-2 !px-3 text-sm"
            onClick={() => navigate(`/player/${opponentTagClean}`)}
          >
            <UserRound className="w-4 h-4" />
            Профиль соперника
          </Button>
        ) : null}
        {comparePath ? (
          <Button
            variant="secondary"
            className="!py-2 !px-3 text-sm"
            onClick={() => navigate(comparePath)}
          >
            <GitCompareArrows className="w-4 h-4" />
            Сравнить колоды
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className={
            "flex items-center gap-2 px-4 py-2 rounded-xl " +
            (battle.won ? "bg-cr-win/10 text-cr-win" : "bg-cr-loss/10 text-cr-loss")
          }
        >
          <Trophy className="w-5 h-5" />
          <span className="font-bold">{battle.won ? "Победа" : "Поражение"}</span>
        </div>
        <div className={getTrophyChangeColor(battle.trophy_change)}>
          {battle.trophy_change >= 0 ? "+" : ""}
          {battle.trophy_change} 🏆
        </div>
        {battle.crown_score ? (
          <div className="text-base text-cr-accent font-semibold">Короны: {battle.crown_score}</div>
        ) : null}
        <div className="text-base text-cr-muted font-semibold">
          Матчап: {battle.matchup_score.toFixed(0)}/100
        </div>
        <div className="text-cr-muted text-base flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {battle.played_at ? battle.played_at : null}
          {battle.played_at && (battle.duration ?? 0) > 0 ? " · " : null}
          {(battle.duration ?? 0) > 0 ? formatTime(battle.duration) : null}
          {!battle.played_at && !(battle.duration ?? 0) ? "—" : null}
        </div>
      </div>

      {battle.outcome_summary ? (
        <Card className="tint-glass-card">
          <div className="flex items-start gap-2">
            <Swords className="w-5 h-5 text-cr-gold shrink-0 mt-0.5" />
            <p className="text-base text-cr-text leading-relaxed font-medium">{battle.outcome_summary}</p>
          </div>
        </Card>
      ) : null}

      {battle.tactical_matchup ? <TacticalMatchupBlock data={battle.tactical_matchup} /> : null}

      {battle.match_difficulty ? <MatchDifficultyBlock data={battle.match_difficulty} /> : null}

      {battle.match_plan ? <MatchPlanBlock data={battle.match_plan} /> : null}

      {(battle.user_elixir || battle.opponent_elixir) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {battle.user_elixir ? (
            <ElixirEfficiencyCard title="Ваш эликсир-профиль" data={battle.user_elixir} />
          ) : null}
          {battle.opponent_elixir ? (
            <ElixirEfficiencyCard title="Эликсир соперника" data={battle.opponent_elixir} />
          ) : null}
        </div>
      )}

      {detailReasons.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Подробный разбор</h3>
          </div>
          <ul className="space-y-2">
            {detailReasons.map((reason, i) => (
              <li key={i} className="text-base text-cr-muted flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cr-gold mt-2 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <KeyCardsBlock
        title="Ваш урон по башням (оценка)"
        items={battle.user_key_cards ?? []}
        accent="win"
      />

      <KeyCardsBlock
        title="Урон соперника по башням (оценка)"
        items={battle.opponent_key_cards ?? []}
        accent="loss"
      />

      {(battle.low_impact_cards?.length ?? 0) > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-cr-muted" />
            <h3 className="font-semibold text-cr-text">Мало повлияли на бой</h3>
          </div>
          <p className="text-xs text-cr-muted mb-3">
            Карты, которые не подходят под матчап — возможно, не были розыграны или не успели сработать.
          </p>
          <div className="flex flex-wrap gap-2">
            {battle.low_impact_cards!.map((c) => (
              <span
                key={c.name}
                className="px-3 py-1 rounded-lg bg-cr-border/20 border border-cr-border/40 text-sm text-cr-muted"
                title={c.note}
              >
                {c.name_ru}
              </span>
            ))}
          </div>
        </Card>
      )}

      {battle.opponent_threats.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-cr-loss" />
            <h3 className="font-semibold text-cr-text">Условие победы соперника</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {battle.opponent_threats.map((threat, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg bg-cr-loss/10 border border-cr-loss/20 text-sm text-cr-loss"
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
          <PlayerDeckGrid
            cards={battle.user_deck_cards?.length ? battle.user_deck_cards : battle.user_deck}
            size="lg"
            showLabels
            className="mb-4"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base">
              <span className="text-cr-muted">Ср. эликсир</span>
              <span className="font-semibold text-cr-text">{battle.user_stats.avg_elixir.toFixed(1)}</span>
            </div>
            <LinearProgress value={battle.user_stats.avg_elixir} max={5} color="#60a5fa" showLabel={false} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-cr-text mb-4">Колода противника</h3>
          <PlayerDeckGrid
            cards={battle.opponent_deck_cards?.length ? battle.opponent_deck_cards : battle.opponent_deck}
            size="lg"
            showLabels
            className="mb-4"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base">
              <span className="text-cr-muted">Ср. эликсир</span>
              <span className="font-semibold text-cr-text">{battle.opponent_stats.avg_elixir.toFixed(1)}</span>
            </div>
            <LinearProgress value={battle.opponent_stats.avg_elixir} max={5} color="#ef4444" showLabel={false} />
          </div>
        </Card>
      </div>
    </div>
  );
}

export { BattleDetailPage as default };
