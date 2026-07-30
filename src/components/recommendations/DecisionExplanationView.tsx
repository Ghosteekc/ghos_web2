import { useCardCatalog } from "@/hooks";
import type { DecisionExplanation, DeckCoaching, RecommendationSwap } from "@/types";

function SwapBlock({
  swap,
  nameRu,
}: {
  swap: RecommendationSwap;
  nameRu: (name: string) => string;
}) {
  const title = swap.drop
    ? `${nameRu(swap.drop)} → ${nameRu(swap.pick)}`
    : nameRu(swap.pick);

  return (
    <div className="rounded-xl border border-cr-border/60 bg-cr-bg/40 p-3 space-y-1.5">
      <p className="text-sm font-semibold text-cr-text">{title}</p>
      {swap.reason ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Причина</p>
          <p className="text-sm text-cr-text leading-snug mt-0.5">{swap.reason}</p>
        </div>
      ) : null}
    </div>
  );
}

function CoachingBlock({ coaching }: { coaching: DeckCoaching }) {
  return (
    <div className="space-y-3">
      {coaching.play_style ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Стиль игры</p>
          <p className="text-sm text-cr-text mt-0.5">{coaching.play_style}</p>
        </div>
      ) : null}
      {coaching.strengths.length > 0 ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Сильные стороны</p>
          <ul className="mt-1 space-y-0.5">
            {coaching.strengths.map((s) => (
              <li key={s} className="text-sm text-cr-text">
                ✔ {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {coaching.key_combinations.length > 0 ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Ключевые комбинации</p>
          <ul className="mt-1 space-y-0.5">
            {coaching.key_combinations.map((c) => (
              <li key={c} className="text-sm text-cr-text">
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {coaching.usage_tips.length > 0 ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Советы по использованию</p>
          <ul className="mt-1 space-y-0.5">
            {coaching.usage_tips.map((t) => (
              <li key={t} className="text-sm text-cr-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

interface DecisionExplanationViewProps {
  explanation: DecisionExplanation | null | undefined;
  coaching?: DeckCoaching | null;
  title?: string;
  className?: string;
  /** Показывать внутренние детали (только для режима разработчика). */
  debug?: boolean;
}

/** Пользовательский блок рекомендаций — без tier / rating / scores. */
export function DecisionExplanationView({
  explanation,
  coaching = null,
  title = "Рекомендации",
  className = "",
  debug = false,
}: DecisionExplanationViewProps) {
  const { nameRu } = useCardCatalog();

  const swaps: RecommendationSwap[] =
    explanation?.swaps?.length
      ? explanation.swaps
      : (explanation?.pick_explanations ?? [])
          .filter((pe) => pe.pick)
          .map((pe) => ({
            drop: pe.drop,
            pick: pe.pick,
            reason: pe.reason || "",
          }));

  const hasSwaps = swaps.length > 0;
  const hasCoaching =
    !!coaching &&
    (coaching.strengths.length > 0 ||
      !!coaching.play_style ||
      coaching.key_combinations.length > 0 ||
      coaching.usage_tips.length > 0);

  if (!hasSwaps && !hasCoaching) return null;

  const heading = hasSwaps ? title : title || "Как играть колодой";

  return (
    <div className={`space-y-3 ${className}`}>
      {heading ? (
        <h3 className="text-base font-semibold text-cr-text">{heading}</h3>
      ) : null}
      {hasSwaps
        ? swaps.map((swap) => (
            <SwapBlock
              key={`${swap.drop ?? ""}-${swap.pick}-${swap.reason}`}
              swap={swap}
              nameRu={nameRu}
            />
          ))
        : hasCoaching && coaching
          ? <CoachingBlock coaching={coaching} />
          : null}
      {debug && import.meta.env.DEV ? (
        <pre className="text-3xs text-cr-muted overflow-auto max-h-40 rounded-lg bg-cr-bg/60 p-2">
          {JSON.stringify(
            {
              why_gaps: explanation?.why_gaps,
              rejected: explanation?.rejected,
              pick_explanations: explanation?.pick_explanations,
              coaching,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}
