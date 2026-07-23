import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import type { Deck } from "@/types";
import { Card, Button } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { cn } from "@/utils";
import { analyzeDeckPassport, getMetricDisplayList } from "./DeckAnalyzer";

interface DeckPassportProps {
  deck: Deck | null;
  onClose: () => void;
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-cr-muted">{label}</span>
        <span className="text-cr-text font-semibold tabular-nums">
          {value.toFixed(1)} / 10
        </span>
      </div>
      <div className="h-2 rounded-full bg-cr-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cr-gold/80 to-yellow-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DeckPassport({ deck, onClose }: DeckPassportProps) {
  const { nameRu } = useCardCatalog();
  const open = deck != null && (deck.cards?.length ?? 0) === 8;

  const analysis = useMemo(
    () => (deck ? analyzeDeckPassport(deck) : null),
    [deck],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !deck || !analysis) return null;

  const metrics = getMetricDisplayList(analysis.metrics);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh]",
          "bg-[#0a0f2e] border border-white/10 rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl flex flex-col overflow-hidden transition-opacity duration-300",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-cr-gold">Ghøsteek Deck Passport</p>
            <h2 className="text-base font-semibold text-cr-text truncate">
              {deck.name || "Анализ колоды"}
            </h2>
          </div>
          <Button variant="ghost" className="!p-2 shrink-0" onClick={onClose} aria-label="Закрыть">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 space-y-5">
          <div className="text-center rounded-xl border border-cr-gold/30 bg-cr-gold/5 py-5 px-4">
            <p className="text-xs text-cr-muted mb-1">Ghøsteek Score</p>
            <p className="text-4xl font-bold text-cr-gold tabular-nums">{analysis.score}</p>
            <p className="text-lg text-yellow-300 tracking-widest mt-1">{analysis.starsDisplay}</p>
            <p className="text-xs text-cr-muted mt-2">{analysis.archetype} · {analysis.playStyle}</p>
          </div>

          <Card className="!p-3">
            <h3 className="text-sm font-semibold text-cr-text mb-3">Характеристики</h3>
            <div className="space-y-3">
              {metrics.map((m) => (
                <MetricBar key={m.key} label={m.label} value={m.value} />
              ))}
            </div>
          </Card>

          <Card className="!p-3">
            <h3 className="text-sm font-semibold text-cr-text mb-3">Основная информация</h3>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {[
                ["Средний эликсир", analysis.basicInfo.avgElixir.toFixed(1)],
                ["Win Condition", nameRu(analysis.basicInfo.primaryWinCondition)],
                ["Тип колоды", analysis.basicInfo.deckType],
                ["Заклинания", String(analysis.basicInfo.spellCount)],
                ["Постройки", String(analysis.basicInfo.buildingCount)],
                ["Воздух", String(analysis.basicInfo.airCount)],
                ["Поддержка", String(analysis.basicInfo.supportCount)],
                ["Цикл", String(analysis.basicInfo.cycleCount)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-cr-muted">{k}</dt>
                  <dd className="text-cr-text font-medium truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="!p-3">
            <h3 className="text-sm font-semibold text-cr-text mb-3">Баланс ролей</h3>
            <ul className="space-y-2">
              {analysis.roleBalance.map((role) => (
                <li key={role.id} className="flex items-center justify-between text-xs">
                  <span className="text-cr-muted">{role.label}</span>
                  <span className={role.present ? "text-cr-win" : "text-cr-gold"}>
                    {role.present ? "✅ Есть" : "⚠ Отсутствует"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="!p-3 border-cr-gold/20 bg-cr-gold/5">
            <h3 className="text-sm font-semibold text-cr-text mb-2">Практичность</h3>
            <p className="text-2xl font-bold text-cr-gold tabular-nums">{analysis.practicality}%</p>
            <div className="mt-3 space-y-1">
              {analysis.practicalityReasons.positive.map((r) => (
                <p key={r} className="text-xs text-cr-win">✔ {r}</p>
              ))}
              {analysis.practicalityReasons.negative.map((r) => (
                <p key={r} className="text-xs text-cr-muted">− {r}</p>
              ))}
            </div>
          </Card>

          <Card className="!p-3">
            <h3 className="text-sm font-semibold text-cr-text mb-1">Сложность освоения</h3>
            <p className="text-base font-semibold text-cr-text">{analysis.difficulty}</p>
            <p className="text-xs text-cr-muted mt-1">Игровой стиль: {analysis.playStyle}</p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="!p-3">
              <h3 className="text-sm font-semibold text-cr-win mb-2">Сильные стороны</h3>
              <ul className="space-y-1">
                {analysis.strengths.map((s) => (
                  <li key={s} className="text-xs text-cr-text">✔ {s}</li>
                ))}
              </ul>
            </Card>
            <Card className="!p-3">
              <h3 className="text-sm font-semibold text-cr-gold mb-2">Слабые стороны</h3>
              <ul className="space-y-1">
                {analysis.weaknesses.map((w) => (
                  <li key={w} className="text-xs text-cr-muted">⚠ {w}</li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="!p-3">
              <h3 className="text-sm font-semibold text-cr-text mb-2">Сильна против</h3>
              <ul className="space-y-1">
                {analysis.matchups.strong.map((m) => (
                  <li key={m} className="text-xs text-cr-win">{m}</li>
                ))}
              </ul>
            </Card>
            <Card className="!p-3">
              <h3 className="text-sm font-semibold text-cr-text mb-2">Слаба против</h3>
              <ul className="space-y-1">
                {analysis.matchups.weak.map((m) => (
                  <li key={m} className="text-xs text-cr-loss">{m}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="!p-3 border-cr-blue/20 bg-cr-blue/5">
            <h3 className="text-sm font-semibold text-cr-text mb-2">Заключение</h3>
            <p className="text-xs text-cr-text leading-relaxed">{analysis.summary}</p>
          </Card>

          <div className="grid grid-cols-4 grid-rows-2 gap-2 pb-2">
            {[...(deck.cards ?? [])]
              .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
              .map((c, i) => (
                <CardTile key={`${c.name}-${i}`} name={c.name} icon={c.icon} size="deck" />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
