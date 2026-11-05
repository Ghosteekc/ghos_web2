import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useCardCatalog } from "@/hooks";
import type { DecisionExplanation, DeckCoaching, RecommendationSwap } from "@/types";
import { getCardCollectionAvailability } from "./collectionAvailability";

type CollectionLoadState =
  | { status: "loading" }
  | { status: "loaded"; cards: unknown }
  | { status: "failed" };

function availabilityLabel(cardName: string, state: CollectionLoadState): string {
  if (state.status === "loading") return "Проверяем коллекцию…";
  if (state.status === "failed") return "Нет данных о коллекции";

  const availability = getCardCollectionAvailability(cardName, state.cards);
  if (availability.status === "missing") return "Нет в коллекции";
  if (availability.status === "unknown") return "Нет данных о карте";
  return availability.level == null
    ? "В коллекции · уровень не указан"
    : `В коллекции · уровень ${availability.level}`;
}

function SwapBlock({
  swap,
  nameRu,
  collectionState,
}: {
  swap: RecommendationSwap;
  nameRu: (name: string) => string;
  collectionState: CollectionLoadState;
}) {
  return (
    <div className="rounded-xl border border-cr-border/60 bg-cr-bg/40 p-3 space-y-1.5">
      <p className="text-sm font-semibold text-cr-text">
        {swap.drop ? (
          <>
            Убрать: {nameRu(swap.drop)} <span aria-hidden>→</span> Добавить: {nameRu(swap.pick)}
          </>
        ) : (
          <>Предлагаемая карта: {nameRu(swap.pick)}</>
        )}
      </p>
      <p className="text-2xs text-cr-muted" aria-live="polite">
        {availabilityLabel(swap.pick, collectionState)}
      </p>
      {swap.reason ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Причина</p>
          <p className="text-sm text-cr-text leading-snug mt-0.5">{swap.reason}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Локализует EN-имена карт в фразах и парах ``CardA + CardB``. */
function localizeCardPhrase(text: string, nameRu: (name: string) => string): string {
  const raw = text.trim();
  if (!raw) return raw;

  const withCombos = raw.replace(
    /([A-Za-z][A-Za-z0-9.'\-]*(?:\s+[A-Za-z][A-Za-z0-9.'\-]*)*)\s*\+\s*([A-Za-z][A-Za-z0-9.'\-]*(?:\s+[A-Za-z][A-Za-z0-9.'\-]*)*)/g,
    (_m, left: string, right: string) =>
      `${nameRu(left.trim())} + ${nameRu(right.trim())}`,
  );

  // Целиком английское имя карты (заголовок блока).
  if (/^[A-Za-z0-9.'\-]+(?:\s+[A-Za-z0-9.'\-]+)*$/.test(withCombos)) {
    return nameRu(withCombos);
  }
  return withCombos;
}

function CoachingBlock({
  coaching,
  nameRu,
}: {
  coaching: DeckCoaching;
  nameRu: (name: string) => string;
}) {
  /** Пары «A + B» — это синергия, не сильные стороны. */
  const strengths = coaching.strengths.filter((s) => !/\s\+\s/.test(s));

  return (
    <div className="space-y-3">
      {coaching.play_style ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Стиль игры</p>
          <p className="text-sm text-cr-text mt-0.5">{coaching.play_style}</p>
        </div>
      ) : null}
      {strengths.length > 0 ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Сильные стороны</p>
          <ul className="mt-1 space-y-0.5">
            {strengths.map((s) => (
              <li key={s} className="text-sm text-cr-text">
                ✔ {s}
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
      {(coaching.card_choices?.length ?? 0) > 0 ? (
        <div>
          <p className="text-2xs uppercase tracking-wide text-cr-muted">Почему выбраны карты</p>
          <div className="mt-1 space-y-1.5">
            {coaching.card_choices.map((choice) => {
              const roles = [...new Set(choice.roles.map((r) => r.trim()).filter(Boolean))];
              const rolesJoined = roles.join(" · ");
              const rolesNorm = new Set(roles.map((r) => r.toLowerCase()));
              const reasonRaw = (choice.reason || "").trim();
              const reason =
                reasonRaw &&
                !rolesNorm.has(reasonRaw.toLowerCase()) &&
                !rolesJoined.toLowerCase().includes(reasonRaw.toLowerCase())
                  ? reasonRaw
                  : "";
              const synergyRaw = localizeCardPhrase(choice.synergy || "", nameRu).trim();
              const synergyIsBareCombo = /^\S.+\s\+\s.+\S$/.test(synergyRaw);
              const synergyIsGeneric =
                /работает в связке с ключевыми картами/i.test(synergyRaw) ||
                /поддерживает общий план колоды/i.test(synergyRaw);
              const synergy =
                synergyRaw &&
                !synergyIsBareCombo &&
                !synergyIsGeneric &&
                synergyRaw.toLowerCase() !== reason.toLowerCase() &&
                !rolesNorm.has(synergyRaw.toLowerCase())
                  ? synergyRaw
                  : "";
              return (
                <div key={choice.card} className="rounded-lg bg-cr-bg/40 px-2.5 py-2">
                  <p className="text-sm font-medium text-cr-text">
                    {localizeCardPhrase(choice.card, nameRu)}
                  </p>
                  {roles.length > 0 ? (
                    <p className="text-2xs text-cr-gold">{rolesJoined}</p>
                  ) : null}
                  {reason ? <p className="text-2xs text-cr-muted mt-0.5">{reason}</p> : null}
                  {synergy ? <p className="text-2xs text-cr-muted">{synergy}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface DecisionExplanationViewProps {
  explanation: DecisionExplanation | null | undefined;
  coaching?: DeckCoaching | null;
  /** Swaps допустимы только в явном режиме «Улучшить мою колоду». */
  showSwaps?: boolean;
  /** Дополнительные варианты, показанные рядом с рекомендацией. */
  suggestedCards?: string[];
  title?: string;
  className?: string;
  /** Показывать внутренние детали (только для режима разработчика). */
  debug?: boolean;
}

/** Пользовательский блок рекомендаций — без tier / rating / scores. */
export function DecisionExplanationView({
  explanation,
  coaching = null,
  showSwaps = true,
  suggestedCards = [],
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

  const hasSwaps = showSwaps && swaps.length > 0;
  const availabilityCards = [...new Set(suggestedCards.filter(Boolean))].filter(
    (card) => !hasSwaps || !swaps.some((swap) => swap.pick === card),
  );
  const hasSuggestedCards = availabilityCards.length > 0;
  const [collectionState, setCollectionState] = useState<CollectionLoadState>({
    status: "loading",
  });

  useEffect(() => {
    if (!hasSwaps && !hasSuggestedCards) return;
    let cancelled = false;
    setCollectionState({ status: "loading" });
    api
      .getPlayerCollection()
      .then((collection) => {
        if (cancelled) return;
        if (collection && Array.isArray(collection.cards)) {
          setCollectionState({ status: "loaded", cards: collection.cards });
        } else {
          setCollectionState({ status: "failed" });
        }
      })
      .catch(() => {
        if (!cancelled) setCollectionState({ status: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [hasSwaps, hasSuggestedCards]);

  const hasCoaching =
    !!coaching &&
    (coaching.strengths.some((s) => !/\s\+\s/.test(s)) ||
      !!coaching.play_style ||
      coaching.usage_tips.length > 0 ||
      (coaching.card_choices?.length ?? 0) > 0);

  if (!hasSwaps && !hasCoaching && !hasSuggestedCards) return null;

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
              collectionState={collectionState}
            />
          ))
        : hasCoaching && coaching
          ? <CoachingBlock coaching={coaching} nameRu={nameRu} />
          : null}
      {hasSuggestedCards ? (
        <div className="rounded-xl border border-cr-border/60 bg-cr-bg/30 p-3 space-y-1.5">
          <p className="text-2xs uppercase tracking-wide text-cr-muted">
            Доступность других вариантов
          </p>
          {availabilityCards.map((card) => (
            <div key={card} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-cr-text">{nameRu(card)}</span>
              <span className="shrink-0 text-right text-cr-muted">
                {availabilityLabel(card, collectionState)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
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
