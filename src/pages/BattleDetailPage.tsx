import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Clock,
  AlertTriangle,
  Shield,
  Swords,
  Target,
} from "lucide-react";
import { Card, Button, Loader, LinearProgress } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { api } from "@/api/client";
import { BattleDetail } from "@/types";
import { formatTime, getTrophyChangeColor, formatBattlePlayedAt } from "@/utils";
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
      <p className="text-[11px] text-cr-muted mb-3">
        Оценка по колоде — API Clash Royale не передаёт точный урон по картам.
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className={`rounded-xl border p-3 ${border}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 shrink-0">
                <CardTile name={item.name} size="sm" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cr-text">{item.name_ru}</p>
                <p className="text-xs text-cr-muted leading-snug">{item.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function BattleDetailPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const b = await api.getBattle(Number(index));
      setBattle(b);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [index]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  if (loading) return <Loader />;
  if (!battle) return <Card className="text-center">Бой не найден</Card>;

  const detailReasons = battle.reasons.length > 1 ? battle.reasons.slice(1) : [];

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
          <div className="text-sm text-cr-accent font-semibold">Короны: {battle.crown_score}</div>
        ) : null}
        <div className="text-sm text-cr-muted font-semibold">
          Матчап: {battle.matchup_score.toFixed(0)}/100
        </div>
        <div className="text-cr-muted text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {battle.played_at ? `${battle.played_at} · ` : ""}
          {formatTime(battle.duration ?? 0)}
        </div>
      </div>

      {battle.outcome_summary ? (
        <Card className="border-cr-gold/30 bg-cr-gold/5">
          <div className="flex items-start gap-2">
            <Swords className="w-5 h-5 text-cr-gold shrink-0 mt-0.5" />
            <p className="text-sm text-cr-text leading-relaxed font-medium">{battle.outcome_summary}</p>
          </div>
        </Card>
      ) : null}

      {detailReasons.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Подробный разбор</h3>
          </div>
          <ul className="space-y-2">
            {detailReasons.map((reason, i) => (
              <li key={i} className="text-sm text-cr-muted flex items-start gap-2">
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
          <p className="text-[11px] text-cr-muted mb-3">
            Карты, которые не подходят под матчап — возможно, не были розыграны или не успели дать value.
          </p>
          <div className="flex flex-wrap gap-2">
            {battle.low_impact_cards!.map((c) => (
              <span
                key={c.name}
                className="px-3 py-1 rounded-lg bg-cr-border/20 border border-cr-border/40 text-xs text-cr-muted"
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
            <h3 className="font-semibold text-cr-text">Win-condition соперника</h3>
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
          <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-4">
            {battle.user_deck.map((name, i) => (
              <div key={i} className="min-w-0 overflow-hidden flex justify-center">
                <CardTile name={name} size="lg" showLabel />
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
          <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-4">
            {battle.opponent_deck.map((name, i) => (
              <div key={i} className="min-w-0 overflow-hidden flex justify-center">
                <CardTile name={name} size="lg" showLabel />
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
    </div>
  );
}

export { BattleDetailPage as default };