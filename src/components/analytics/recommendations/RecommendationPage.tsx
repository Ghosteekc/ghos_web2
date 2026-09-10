import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import { Card, ErrorState, EmptyState } from "@/components/ui";
import { usePageRefresh } from "@/hooks";
import type { MetaUpgradeRecommendationsData } from "@/types";
import { RecommendationCard } from "./RecommendationCard";
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить рекомендации по прокачке");
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

  if (data.status !== "ok") {
    return (
      <AnalyticsPanelReveal loading={false}>
        <EmptyState title={data.message ?? "Для рекомендаций пока недостаточно данных"} />
      </AnalyticsPanelReveal>
    );
  }

  return (
    <AnalyticsPanelReveal loading={false}>
      <div className="space-y-5 recommendations-panel">
        <Card className="border-cr-border">
          <p className="text-base font-semibold text-cr-text">Приоритет прокачки</p>
          <p className="text-sm text-cr-muted mt-1 leading-relaxed">
            Карты из твоей активной колоды, которые встречаются в сильных текущих колодах меты.
          </p>
          <p className="text-sm text-cr-gold mt-2 recommendation-accent">
            Арена {data.arena} · целевой уровень: {data.recommended_level}
          </p>
          {data.updated_at ? (
            <p className="text-2xs text-cr-muted mt-2">
              Мета обновлена: {new Date(data.updated_at).toLocaleString("ru-RU")}
            </p>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.cards.map((card) => (
            <RecommendationCard key={card.name} card={card} />
          ))}
        </div>

        <p className="text-2xs text-cr-muted leading-relaxed px-1">{data.sample_note}</p>
      </div>
    </AnalyticsPanelReveal>
  );
}
