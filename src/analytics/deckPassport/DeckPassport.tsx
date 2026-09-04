import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { Deck, RecommendationResult } from "@/types";
import { Card, Button } from "@/components/ui";
import { PlayerDeckGrid } from "@/components/cards";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";
import { cn } from "@/utils";
import { api, isProRequiredError } from "@/api/client";
import { useGhosteekPro } from "@/hooks/useGhosteekPro";
import { ProLockCard } from "@/components/pro";
import { analyzeDeckPassport, getMetricDisplayList } from "./DeckAnalyzer";
import { collectCardNames } from "./DeckStatistics";
import { DecisionExplanationView } from "@/components/recommendations/DecisionExplanationView";
import { isForceMotionEnabled } from "@/perf/bootstrap";

interface DeckPassportProps {
  deck: Deck | null;
  onClose: () => void;
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-cr-muted">{label}</span>
        <span className="text-cr-text font-semibold tabular-nums">
          {value.toFixed(1)} / 10
        </span>
      </div>
      <div className="h-2 rounded-full bg-cr-border overflow-hidden">
        <div
          className="accent-meter-fill h-full rounded-full bg-gradient-to-r from-cr-gold/80 to-yellow-400 origin-left transition-transform duration-200 ease-out"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  );
}

export function DeckPassport({ deck, onClose }: DeckPassportProps) {
  const { nameRu } = useCardCatalog();
  const open = deck != null && (deck.cards?.length ?? 0) === 8;
  const reducedMotion = useReducedMotion() && !isForceMotionEnabled();
  const { isPro, loading: proLoading } = useGhosteekPro();
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [recLocked, setRecLocked] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (!open || !deck) {
      setRecommendation(null);
      setRecError(null);
      setRecLocked(false);
      return;
    }
    // Колода из конструктора уже прошла Engine с origin=builder — не переоцениваем как player.
    if (deck.type === "constructor" && deck.recommendation) {
      setRecommendation(deck.recommendation);
      setRecError(null);
      setRecLocked(false);
      setLoadingRec(false);
      return;
    }
    if (proLoading) return;
    // Улучшение колоды — платная функция: без Pro не тратим запрос, показываем замок.
    if (!isPro) {
      setRecommendation(null);
      setRecError(null);
      setRecLocked(true);
      setLoadingRec(false);
      return;
    }
    const names = collectCardNames(deck.cards);
    let cancelled = false;
    setLoadingRec(true);
    setRecError(null);
    setRecLocked(false);
    const isBuilder = deck.type === "constructor";
    api
      .recommendDeck(names, false, {
        origin: isBuilder ? "builder" : "player",
        builderScore: isBuilder ? deck.score_breakdown?.total ?? null : null,
      })
      .then((data) => {
        if (!cancelled) setRecommendation(data.recommendation);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRecommendation(null);
        if (isProRequiredError(err)) {
          setRecLocked(true);
          setRecError(null);
          return;
        }
        setRecError(err instanceof Error ? err.message : "Не удалось загрузить рекомендации");
      })
      .finally(() => {
        if (!cancelled) setLoadingRec(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, deck, isPro, proLoading]);

  const analysis = useMemo(
    () => (deck ? analyzeDeckPassport(deck, recommendation) : null),
    [deck, recommendation],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !deck) return null;

  const metrics = analysis ? getMetricDisplayList(analysis.metrics) : [];

  const passport = (
    <div className="deck-passport-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <motion.button
        type="button"
        aria-label="Закрыть"
        className="deck-passport-backdrop absolute inset-0"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: [0.22, 0.08, 0.24, 1] }}
      />

      <motion.div
        className={cn(
          "deck-passport-sheet relative w-full sm:max-w-lg",
          "max-h-[calc(100dvh-var(--device-safe-top)-1.75rem)] sm:max-h-[86vh]",
          "border border-cr-border rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl flex flex-col overflow-hidden transition-opacity duration-[220ms]",
        )}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.16 : 0.24, ease: [0.22, 0.08, 0.24, 1] }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-cr-border shrink-0">
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-wider text-cr-gold recommendation-accent">
              Ghøsteek Deck Passport
            </p>
            <h2 className="text-[16px] font-semibold text-cr-text truncate">
              {deck.name || "Анализ колоды"}
            </h2>
          </div>
          <Button variant="ghost" className="!p-2 shrink-0" onClick={onClose} aria-label="Закрыть">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 space-y-5">
          {loadingRec && (
            <p className="text-sm text-cr-muted text-center py-6">Загрузка рекомендаций…</p>
          )}
          {recError && (
            <Card className="!p-3">
              <p className="text-sm text-cr-loss">{recError}</p>
            </Card>
          )}
          {recLocked && <ProLockCard feature="deck_improve" compact cta="Открыть улучшение колод" />}

          {analysis && (
            <>
              <Card className="!p-5 text-center">
                <p className="text-sm text-cr-muted mb-1">Ghøsteek Score</p>
                <p className="text-4xl font-bold text-cr-gold tabular-nums">{analysis.score}</p>
                <p className="text-lg text-cr-gold tracking-widest mt-1">{analysis.starsDisplay}</p>
                <p className="text-sm text-cr-muted mt-2">
                  {analysis.archetype} · {analysis.playStyle}
                </p>
                <p className="text-2xs text-cr-muted mt-1">
                  Risk {analysis.riskScore.toFixed(0)} / 100
                </p>
              </Card>

              <Card className="!p-3">
                <h3 className="text-base font-semibold text-cr-text mb-3">Характеристики</h3>
                <div className="space-y-3">
                  {metrics.map((m) => (
                    <MetricBar key={m.key} label={m.label} value={m.value} />
                  ))}
                </div>
              </Card>

              <Card className="!p-3">
                <h3 className="text-base font-semibold text-cr-text mb-3">Основная информация</h3>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  {[
                    ["Средний эликсир", analysis.basicInfo.avgElixir.toFixed(1)],
                    ["Главная угроза", nameRu(analysis.basicInfo.primaryWinCondition)],
                    ["Тип колоды", analysis.basicInfo.deckType],
                    ["Заклинания", String(analysis.basicInfo.spellCount)],
                    ["Постройки", String(analysis.basicInfo.buildingCount)],
                    ["Анти-воздух", String(analysis.basicInfo.airCount)],
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
                <h3 className="text-base font-semibold text-cr-text mb-3">Баланс ролей</h3>
                <ul className="space-y-2">
                  {analysis.roleBalance.map((role) => (
                    <li key={role.id} className="flex items-center justify-between text-sm">
                      <span className="text-cr-muted">{role.label}</span>
                      <span className={role.present ? "text-cr-win" : "text-cr-gold"}>
                        {role.present ? "✅ Есть" : "⚠ Отсутствует"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="!p-3 border-cr-border">
                <h3 className="text-base font-semibold text-cr-text mb-2">Практичность</h3>
                <p className="text-2xl font-bold text-cr-gold tabular-nums">{analysis.practicality}%</p>
                <div className="mt-3 space-y-1">
                  {analysis.practicalityReasons.positive.map((r) => (
                    <p key={r} className="text-sm text-cr-win">✔ {r}</p>
                  ))}
                  {analysis.practicalityReasons.negative.map((r) => (
                    <p key={r} className="text-sm text-cr-muted">− {r}</p>
                  ))}
                </div>
              </Card>

              <Card className="!p-3">
                <h3 className="text-base font-semibold text-cr-text mb-1">Сложность освоения</h3>
                <p className="text-[16px] font-semibold text-cr-text">{analysis.difficulty}</p>
                <p className="text-sm text-cr-muted mt-1">Игровой стиль: {analysis.playStyle}</p>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="!p-3">
                  <h3 className="text-base font-semibold text-cr-win mb-2">Сильные стороны</h3>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s) => (
                      <li key={s} className="text-sm text-cr-text">✔ {s}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="!p-3">
                  <h3 className="text-base font-semibold text-cr-gold mb-2">Слабые стороны</h3>
                  <ul className="space-y-1">
                    {analysis.weaknesses.map((w) => (
                      <li key={w} className="text-sm text-cr-muted">⚠ {w}</li>
                    ))}
                  </ul>
                </Card>
              </div>

              {recommendation?.coaching ||
              (analysis.decisionExplanation &&
                (analysis.decisionExplanation.swaps?.length ||
                  analysis.decisionExplanation.pick_explanations.some((p) => p.pick))) ? (
                <Card className="!p-3">
                  <DecisionExplanationView
                    explanation={analysis.decisionExplanation}
                    coaching={recommendation?.coaching}
                    showSwaps={deck.type !== "constructor" && recommendation?.origin !== "builder"}
                    title={recommendation?.coaching && !recommendation?.improvement_plan.needed
                      ? "Как играть колодой"
                      : "Рекомендации"}
                  />
                </Card>
              ) : analysis.improvements.length > 0 ? (
                <Card className="!p-3">
                  <h3 className="text-base font-semibold text-cr-text mb-2">Рекомендации</h3>
                  <ul className="space-y-2">
                    {analysis.improvements.map((item) => (
                      <li key={`${item.category}-${item.message}`} className="text-sm text-cr-text">
                        <p>{item.message}</p>
                        {item.suggested_cards.length > 0 && (
                          <p className="text-cr-muted text-2xs mt-0.5">
                            {item.suggested_cards.map((c) => nameRu(c)).join(", ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="!p-3">
                  <h3 className="text-base font-semibold text-cr-text mb-2">Сильна против</h3>
                  <ul className="space-y-1">
                    {analysis.matchups.strong.map((m) => (
                      <li key={m} className="text-sm text-cr-win">{m}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="!p-3">
                  <h3 className="text-base font-semibold text-cr-text mb-2">Слаба против</h3>
                  <ul className="space-y-1">
                    {analysis.matchups.weak.map((m) => (
                      <li key={m} className="text-sm text-cr-loss">{m}</li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card className="!p-3 border-cr-blue/20 bg-cr-blue/5">
                <h3 className="text-base font-semibold text-cr-text mb-2">Заключение</h3>
                <p className="text-sm text-cr-text leading-relaxed">{analysis.summary}</p>
              </Card>

              <div className="pb-2">
                <PlayerDeckGrid cards={deck.cards} size="deck" />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );

  // The decks tab uses transform for smooth handoffs. A portal prevents that
  // ancestor from becoming the containing block for this full-screen layer.
  return createPortal(passport, document.body);
}
