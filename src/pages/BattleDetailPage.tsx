import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  Bot,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { Card, Button, Loader, LinearProgress, ErrorState, PageHeader, ElixirIcon } from "@/components/ui";
import { CardTile, PlayerDeckGrid } from "@/components/cards";
import {
  BattleLeagueBadgeLabel,
  BattleLeaguePair,
  formatRankedProgressChange,
  isAbsoluteChampionLeague,
  rankedProgressDelta,
} from "@/components/battles/BattleLeagueMark";
import { api, ApiError } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import {
  BattleCoach,
  BattleDetail,
  CoachInsight,
  ElixirEfficiency,
  MatchDifficulty,
  MatchPlan,
  TacticalMatchup,
} from "@/types";
import { formatTime, getTrophyChangeColor, formatPlayerTag, cn } from "@/utils";
import { buildDeckComparePath } from "@/utils/deckActions";
import { contextFromBattle, openGhosteekAi } from "@/utils/aiPageContext";
import { usePageRefresh } from "@/hooks";
import { ProLockCard } from "@/components/pro";

function confidenceLabel(confidence: string): string {
  switch (confidence) {
    case "high":
      return "высокая уверенность";
    case "medium":
      return "средняя уверенность";
    case "low":
      return "низкая уверенность";
    case "insufficient":
      return "данных недостаточно";
    default:
      return confidence;
  }
}

function CoachInsightCard({
  insight,
  icon,
  accent = "default",
}: {
  insight: CoachInsight | null | undefined;
  icon: ReactNode;
  accent?: "default" | "loss" | "win" | "warn";
}) {
  if (!insight) return null;
  const insufficient = insight.confidence === "insufficient";
  const border =
    accent === "loss"
      ? "border-cr-loss/25 bg-cr-loss/5"
      : accent === "win"
        ? "border-cr-win/25 bg-cr-win/5"
        : accent === "warn"
          ? "border-cr-gold/30 bg-cr-gold/5"
          : "border-cr-border/50 bg-cr-surface/40";

  return (
    <div className={`rounded-xl border p-3 coach-insight-card ${border}`}>
      <div className="flex items-start gap-2 mb-1.5">
        <span className="shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-cr-text">{insight.title}</h4>
            <span className="text-[10px] uppercase tracking-wide text-cr-text/70">
              {confidenceLabel(insight.confidence)}
            </span>
          </div>
          <p
            className={
              "text-sm leading-relaxed mt-1 " +
              (insufficient ? "text-cr-text/75 italic" : "text-cr-text")
            }
          >
            {insight.text}
          </p>
          {!insufficient && insight.evidence.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {insight.evidence.map((line, i) => (
                <li key={i} className="text-xs text-cr-text flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-cr-text/50 mt-1.5 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BattleCoachBlock({ data }: { data: BattleCoach }) {
  // Только уникальный слой: перелом по длительности/счёту и «если бы» по дыре в контрах.
  // Ошибки / исход / опасность / лучший момент живут в тактике, плане и summary.
  const turning =
    data.turning_point && data.turning_point.confidence !== "insufficient"
      ? data.turning_point
      : null;
  const alt =
    data.counterfactual && data.counterfactual.confidence !== "insufficient"
      ? data.counterfactual
      : null;

  if (!turning && !alt) return null;

  return (
    <Card className="tint-glass-card">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-cr-gold" />
        <h3 className="font-semibold text-cr-text">Тренер боя</h3>
      </div>
      <p className="text-xs text-cr-muted mb-4">
        То, чего нет в тактике и плане: перелом по длительности/счёту и гипотеза замены карты.
        Запись боя из игры для этого раздела недоступна.
      </p>

      <div className="space-y-3">
        <CoachInsightCard
          insight={turning}
          accent="warn"
          icon={<GitBranch className="w-4 h-4 text-cr-gold" />}
        />
        <CoachInsightCard
          insight={alt}
          accent="warn"
          icon={<GitCompareArrows className="w-4 h-4 text-cr-gold" />}
        />
      </div>
    </Card>
  );
}

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

const ELIXIR_PROFILE_RU: Record<string, string> = {
  "Fast Cycle": "Быстрый цикл",
  "Medium Cycle": "Средний цикл",
  "Heavy Control": "Тяжёлый контроль",
  "Heavy Beatdown": "Тяжёлый битдаун",
  "Bridge Pressure": "Давление на мосту",
  "Split Pressure": "Сплит-давление",
};

const ELIXIR_METRICS: {
  key: keyof ElixirEfficiency;
  label: string;
  hint: string;
}[] = [
  {
    key: "cheap_rotation",
    label: "Лёгкие карты в колоде",
    hint: "Сколько карт за 1–3 эликсира — чем выше шкала, тем проще крутить цикл",
  },
  {
    key: "punish_speed",
    label: "Скорость контрудара",
    hint: "Насколько быстро можно наказать ошибку дешёвой угрозой для башни",
  },
  {
    key: "recovery_speed",
    label: "Возврат после трат",
    hint: "Как быстро колода снова готова атаковать после защиты",
  },
  {
    key: "double_elixir_power",
    label: "Сила в ×2 эликсире",
    hint: "Тяжёлые танки и дорогие карты, которые раскрываются в дабле",
  },
  {
    key: "overtime_strength",
    label: "Сила в овертайме",
    hint: "Добивание, осада, здания и спеллы для затяжного конца",
  },
];

function ElixirEfficiencyCard({ title, data }: { title: string; data: ElixirEfficiency }) {
  const profileRu = ELIXIR_PROFILE_RU[data.elixir_profile] || data.elixir_profile;
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-5 h-5 text-cr-gold shrink-0" />
          <h3 className="font-semibold text-cr-text truncate">{title}</h3>
        </div>
        <span className="text-xs font-semibold text-cr-accent shrink-0 px-2 py-1 rounded-lg bg-cr-accent/10 border border-cr-accent/20">
          {profileRu}
        </span>
      </div>
      <p className="text-xs text-cr-muted mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span>По составу колоды</span>
        <span className="text-cr-border">·</span>
        <span className="inline-flex items-center gap-0.5">
          средний
          <ElixirIcon size={11} className="text-[#d946ef]" />
          {data.average_cost.toFixed(1)}
        </span>
        <span className="text-cr-border">·</span>
        <span className="inline-flex items-center gap-0.5">
          цикл 4 самых дешёвых =
          <span className="font-semibold text-cr-text tabular-nums">{data.effective_cycle}</span>
          <ElixirIcon size={12} className="text-[#d946ef]" />
        </span>
      </p>
      <div className="space-y-3 mb-3">
        {ELIXIR_METRICS.map(({ key, label, hint }) => {
          const value = Number(data[key]) || 0;
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-0.5 gap-2">
                <span className="text-cr-text font-medium">{label}</span>
                <span className="text-cr-muted tabular-nums shrink-0">{value}/100</span>
              </div>
              <p className="text-[11px] text-cr-muted leading-snug mb-1">{hint}</p>
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
        Оценка по составу колод: контры, цикл, здания, воздух, спеллы и главные угрозы.
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

function MatchPlanBlock({
  data,
  hidePhases,
  hideAvoid,
}: {
  data: MatchPlan;
  /** Фазы уже в тактическом разборе (early/mid/late). */
  hidePhases?: boolean;
  /** Avoid уже в «Грубые ошибки» тактики. */
  hideAvoid?: boolean;
}) {
  const gp = data.game_plan;
  const showPhases =
    !hidePhases && gp.phase_1.length + gp.phase_2.length + gp.phase_3.length > 0;
  const avoid = hideAvoid ? [] : data.avoid;
  if (!showPhases && !avoid.length && !data.save_cards.length && !data.win_condition_window) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Map className="w-5 h-5 text-cr-gold" />
        <h3 className="font-semibold text-cr-text">План на матчап</h3>
      </div>
      <p className="text-xs text-cr-muted mb-4">
        {hidePhases || hideAvoid
          ? "Окно атаки и карты, которые лучше беречь — без повтора фаз и запретов из тактики."
          : "План из состава колод и тактических взаимодействий."}
      </p>
      <div className="space-y-4">
        {showPhases ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TipList title="Фаза 1 — начало" items={gp.phase_1} />
            <TipList title="Фаза 2 — преимущество" items={gp.phase_2} />
            <TipList title="Фаза 3 — финиш" items={gp.phase_3} />
          </div>
        ) : null}
        {data.win_condition_window ? (
          <div className="rounded-xl border border-cr-accent/25 bg-cr-accent/5 p-3">
            <h4 className="text-sm font-semibold text-cr-text mb-1">Окно атаки</h4>
            <p className="text-sm text-cr-muted leading-snug">{data.win_condition_window}</p>
          </div>
        ) : null}
        <TipList title="Категорически нельзя" items={avoid} />
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

  const cacheKey = battleTime
    ? `battle-time-v3:${decodeURIComponent(battleTime)}`
    : index !== undefined && index !== ""
      ? `battle-v3:${Number(index)}`
      : null;

  const [battle, setBattle] = useState<BattleDetail | null>(() =>
    cacheKey ? cacheGet<BattleDetail>(cacheKey) : null,
  );
  const [loading, setLoading] = useState(() => !(cacheKey && cacheHas(cacheKey)));
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
      if (!(cacheKey && cacheHas(cacheKey))) {
        setBattle(null);
      }
      setError(e instanceof ApiError ? e.message : "Бой не найден");
    } finally {
      setLoading(false);
    }
  }, [index, battleTime, cacheKey]);

  usePageRefresh(load);

  useEffect(() => {
    if (!(cacheKey && cacheHas(cacheKey))) {
      setLoading(true);
    }
    void load();
  }, [load, cacheKey]);

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

  const hasTacticalPhases = Boolean(
    battle.tactical_matchup &&
      battle.tactical_matchup.early_game.length +
        battle.tactical_matchup.mid_game.length +
        battle.tactical_matchup.late_game.length >
        0,
  );
  const hasTacticalMistakes = Boolean(
    battle.tactical_matchup && battle.tactical_matchup.worst_mistakes.length > 0,
  );
  const hasDangerCards = Boolean(
    battle.tactical_matchup && battle.tactical_matchup.danger_cards.length > 0,
  );
  const detailedLocked = battle.detailed_unlocked === false || battle.pro_required === true;
  const hasElixirProfiles = Boolean(battle.user_elixir || battle.opponent_elixir);
  const showMatchupChip = !battle.match_difficulty;
  const absoluteChampion = isAbsoluteChampionLeague(battle.user_league);

  // reasons[0] = outcome_summary; дальше — только контры (compact API) или старый полный список.
  // Не показываем строки, которые уже в summary / сложности матчапа.
  const knownReasonDupes = new Set<string>(
    [
      battle.outcome_summary || "",
      ...(battle.match_difficulty?.reasons ?? []),
    ]
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const hasCounterfactual = Boolean(
    battle.battle_coach?.counterfactual &&
      battle.battle_coach.counterfactual.confidence !== "insufficient",
  );
  const detailReasons = (battle.reasons.length > 1 ? battle.reasons.slice(1) : []).filter(
    (line) => {
      const t = line.trim();
      if (!t || knownReasonDupes.has(t)) return false;
      if (/^Матчап:\s*\d+/i.test(t)) return false;
      if (/^Счёт по коронам:/i.test(t)) return false;
      if (/^Длительность:/i.test(t)) return false;
      if (/ключевая карта/i.test(t)) return false;
      if (/^Мало влияли на исход/i.test(t)) return false;
      if (/средний эликсир выше/i.test(t)) return false;
      // «Если бы» в Coach уже даёт конкретную замену при отсутствии контры.
      if (hasCounterfactual && /^Нет счётчика на/i.test(t)) return false;
      return true;
    },
  );

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
        <Button
          variant="secondary"
          className="!py-2 !px-3 text-sm"
          onClick={() =>
            openGhosteekAi(
              navigate,
              contextFromBattle({
                battleIndex: battle.index,
                battleTime: battleTime ? decodeURIComponent(battleTime) : undefined,
                userDeck: battle.user_deck,
                opponentDeck: battle.opponent_deck,
                opponentName: battle.opponent_name,
              }),
            )
          }
        >
          <Bot className="w-4 h-4" />
          Спросить Ghosteek
        </Button>
      </div>

      <Card className="!py-3 !px-4">
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
          {battle.is_ranked ? <BattleLeagueBadgeLabel className="text-xs" /> : null}
          <div
            className={cn(
              "inline-flex items-center gap-1 text-base font-bold",
              getTrophyChangeColor(
                battle.is_ranked
                  ? rankedProgressDelta(battle.won, battle.trophy_change, battle.user_league)
                  : battle.trophy_change,
              ),
            )}
          >
            {battle.is_ranked
              ? formatRankedProgressChange(battle.won, battle.trophy_change, battle.user_league)
              : `${battle.trophy_change >= 0 ? "+" : ""}${battle.trophy_change} 🏆`}
            {absoluteChampion ? (
              <Trophy className="h-4 w-4 shrink-0 text-violet-400" aria-label="Кубки абсолютного чемпиона" />
            ) : null}
          </div>
          {battle.crown_score ? (
            <div className="text-base text-cr-text font-semibold">Короны: {battle.crown_score}</div>
          ) : null}
          {showMatchupChip ? (
            <div className="text-base text-cr-text/80 font-semibold">
              Матчап: {battle.matchup_score.toFixed(0)}/100
            </div>
          ) : null}
          <div className="text-cr-text/80 text-base flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {battle.played_at ? battle.played_at : null}
            {battle.played_at && (battle.duration ?? 0) > 0 ? " · " : null}
            {(battle.duration ?? 0) > 0 ? formatTime(battle.duration) : null}
            {!battle.played_at && !(battle.duration ?? 0) ? "—" : null}
          </div>
        </div>
        {battle.is_ranked ? (
          <BattleLeaguePair
            user={battle.user_league}
            opponent={battle.opponent_league}
            className="mt-3 pt-3 border-t border-cr-border/60"
          />
        ) : null}
      </Card>

      {battle.outcome_summary ? (
        <Card className="tint-glass-card">
          <div className="flex items-start gap-2">
            <Swords className="w-5 h-5 text-cr-gold shrink-0 mt-0.5" />
            <p className="text-base text-cr-text leading-relaxed font-medium">{battle.outcome_summary}</p>
          </div>
        </Card>
      ) : null}

      {detailedLocked ? (
        <ProLockCard
          feature="battle_detail"
          cta="Разблокировать разбор"
          description="Тактика по фазам, план на матч, сложность матчапа, эликсир-профили и тренер боя доступны в Ghosteek Pro. Итог боя и колоды остаются бесплатными."
        />
      ) : null}

      {battle.match_difficulty ? <MatchDifficultyBlock data={battle.match_difficulty} /> : null}

      {battle.tactical_matchup ? <TacticalMatchupBlock data={battle.tactical_matchup} /> : null}

      {battle.match_plan ? (
        <MatchPlanBlock
          data={battle.match_plan}
          hidePhases={hasTacticalPhases}
          hideAvoid={hasTacticalMistakes}
        />
      ) : null}

      {battle.battle_coach ? <BattleCoachBlock data={battle.battle_coach} /> : null}

      {hasElixirProfiles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {battle.user_elixir ? (
            <ElixirEfficiencyCard title="Твой эликсир-профиль" data={battle.user_elixir} />
          ) : null}
          {battle.opponent_elixir ? (
            <ElixirEfficiencyCard title="Эликсир соперника" data={battle.opponent_elixir} />
          ) : null}
        </div>
      ) : null}

      {detailReasons.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Контры на угрозы</h3>
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
        title="Твой урон по башням (оценка)"
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

      {/* Угрозы WC — только если нет danger_cards (там та же информация богаче). */}
      {!hasDangerCards && battle.opponent_threats.length > 0 && (
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
          <h3 className="font-semibold text-cr-text mb-4">Твоя колода</h3>
          <PlayerDeckGrid
            cards={battle.user_deck_cards?.length ? battle.user_deck_cards : battle.user_deck}
            size="lg"
            showLabels
            className={hasElixirProfiles ? undefined : "mb-4"}
          />
          {!hasElixirProfiles ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-base">
                <span className="text-cr-muted">Ср. эликсир</span>
                <span className="font-semibold text-cr-text">{battle.user_stats.avg_elixir.toFixed(1)}</span>
              </div>
              <LinearProgress value={battle.user_stats.avg_elixir} max={5} color="#60a5fa" showLabel={false} />
            </div>
          ) : null}
        </Card>

        <Card>
          <h3 className="font-semibold text-cr-text mb-4">Колода противника</h3>
          <PlayerDeckGrid
            cards={battle.opponent_deck_cards?.length ? battle.opponent_deck_cards : battle.opponent_deck}
            size="lg"
            showLabels
            className={hasElixirProfiles ? undefined : "mb-4"}
          />
          {!hasElixirProfiles ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-base">
                <span className="text-cr-muted">Ср. эликсир</span>
                <span className="font-semibold text-cr-text">
                  {battle.opponent_stats.avg_elixir.toFixed(1)}
                </span>
              </div>
              <LinearProgress
                value={battle.opponent_stats.avg_elixir}
                max={5}
                color="#ef4444"
                showLabel={false}
              />
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export { BattleDetailPage as default };
