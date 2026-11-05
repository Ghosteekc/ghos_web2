import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import { Card, ErrorState, EmptyState } from "@/components/ui";
import { usePageRefresh } from "@/hooks";
import type { MetaUpgradeRecommendationsData } from "@/types";
import { RecommendationCard } from "./RecommendationCard";
import { CurrentDeckCard } from "./CurrentDeckCard";
import { recommendationViewForStatus } from "./recommendationView";
import { AnalyticsPanelReveal } from "../AnalyticsPanelReveal";

const CACHE_KEY = "meta-upgrade-priorities-v1";

export function RecommendationsPanel() {
  const [data, setData] = useState<MetaUpgradeRecommendationsData | null>(() =>
    cacheGet<MetaUpgradeRecommendationsData>(CACHE_KEY),
  );
  const [loading, setLoading] = useState(() => !cacheHas(CACHE_KEY));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cacheHas(CACHE_KEY)) setLoading(true);
    setError(null);
    try {
      setData(await api.getMetaUpgradePriorities());
    } catch {
      setError("Не удалось загрузить рекомендации по прокачке. Попробуй обновить страницу позже.");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <AnalyticsPanelReveal loading />;
  if (error) return <AnalyticsPanelReveal loading={false}><ErrorState title={error} /></AnalyticsPanelReveal>;
  if (!data) return <AnalyticsPanelReveal loading={false}><EmptyState title="Рекомендации недоступны" /></AnalyticsPanelReveal>;

  const view = recommendationViewForStatus(data.status);
  if (!view.showCurrentDeck) {
    return (
      <AnalyticsPanelReveal loading={false}>
        <EmptyState
          title="Текущая колода не найдена"
          description={data.message ?? "API не передал экипированную колоду игрока."}
        />
      </AnalyticsPanelReveal>
    );
  }

  return (
    <AnalyticsPanelReveal loading={false}>
      <div className="space-y-5 recommendations-panel">
        <Card className="border-cr-border">
          <p className="text-base font-semibold text-cr-text">
            {view.showMetaPriorities ? "Приоритет прокачки" : "Текущая колода"}
          </p>
          {view.showMetaPriorities ? (
            <>
              <p className="text-sm text-cr-muted mt-1 leading-relaxed">
                Приоритеты основаны на картах твоей колоды, найденных в сильных колодах текущей меты.
              </p>
              {data.recommended_level != null ? (
                <p className="text-sm text-cr-gold mt-2 recommendation-accent">
                  Арена {data.arena} · рекомендуемый уровень по арене: {data.recommended_level}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-cr-muted mt-1 leading-relaxed">
              {data.message ?? "Приоритеты меты сейчас не сформированы. Ниже показаны только фактические данные колоды."}
            </p>
          )}
          {view.showMetaFreshness && data.updated_at ? (
            <p className="text-2xs text-cr-muted mt-2">
              Мета обновлена: {new Date(data.updated_at).toLocaleString("ru-RU")}
            </p>
          ) : null}
        </Card>

        {view.showMetaPriorities ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.cards.map((card) => (
              <RecommendationCard key={card.name} card={card} />
            ))}
          </div>
        ) : null}

        {view.showCurrentDeck && data.current_deck_cards.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-cr-text">Фактические уровни текущей колоды</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.current_deck_cards.map((card) => (
                <CurrentDeckCard key={card.name} card={card} collectionAvailable={data.status !== "no_collection"} />
              ))}
            </div>
          </section>
        ) : null}

        {view.showMetaFreshness && data.sample_note ? (
          <p className="text-2xs text-cr-muted leading-relaxed px-1">{data.sample_note}</p>
        ) : null}
      </div>
    </AnalyticsPanelReveal>
  );
}
