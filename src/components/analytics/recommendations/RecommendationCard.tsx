import { cn } from "@/utils";
import type { CardRecommendation } from "./recommendationEngine";
import { statusLabel } from "./recommendationEngine";

interface RecommendationCardProps {
  card: CardRecommendation;
}

export function RecommendationCard({ card }: RecommendationCardProps) {
  const statusClass =
    card.status === "ok"
      ? "text-cr-win"
      : card.status === "upgrade"
        ? "text-cr-gold"
        : "text-cr-muted";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-cr-gold/30 hover:bg-cr-gold/5">
      <div className="w-12 h-[3.75rem] shrink-0 rounded-lg border border-white/10 bg-cr-bg/80 overflow-hidden flex items-center justify-center">
        {card.icon ? (
          <img
            src={card.icon}
            alt={card.nameRu}
            className="h-full w-full object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <span className="text-lg">🔥</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-cr-text truncate">{card.nameRu}</p>
        <p className="text-xs text-cr-muted mt-0.5">
          Уровень:{" "}
          <span className="text-cr-text tabular-nums">
            {card.currentLevel ?? "—"}
          </span>
        </p>
        <p className="text-xs text-cr-muted">
          Рекомендуемый:{" "}
          <span className="text-cr-gold tabular-nums">{card.recommendedLevel}</span>
        </p>
        <p className={cn("text-xs font-medium mt-1.5 leading-snug", statusClass)}>
          {statusLabel(card.status)}
        </p>
      </div>
    </div>
  );
}
