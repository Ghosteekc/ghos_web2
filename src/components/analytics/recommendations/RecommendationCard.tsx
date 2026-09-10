import { cn } from "@/utils";
import type { MetaUpgradePriorityCard } from "@/types";

interface RecommendationCardProps {
  card: MetaUpgradePriorityCard;
}

export function RecommendationCard({ card }: RecommendationCardProps) {
  return (
    <div className="recommendation-card flex items-start gap-3 rounded-xl border border-cr-border p-3 transition-colors">
      <div className="w-12 h-[3.75rem] shrink-0 rounded-lg border border-cr-border bg-cr-surface overflow-hidden flex items-center justify-center">
        {card.icon ? (
          <img
            src={card.icon}
            alt={card.name_ru}
            className="h-full w-full object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <span className="text-lg">🔥</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-cr-text truncate">{card.name_ru}</p>
        <p className="text-sm text-cr-muted mt-0.5">
          Уровень:{" "}
          <span className="text-cr-text tabular-nums">{card.level}</span>
        </p>
        <p className="text-sm text-cr-muted">
          Цель для арены: <span className="text-cr-gold tabular-nums recommendation-accent">{card.recommended_level}</span>
          {" · "}+{card.deficit} ур.
        </p>
        <p className={cn("text-sm font-medium mt-1.5 leading-snug", "text-cr-win")}>
          В {card.meta_deck_count} сильных колодах меты
        </p>
        <p className="text-2xs text-cr-muted mt-1">
          {card.observed_games.toLocaleString("ru-RU")} боёв в выборке
          {card.meta_win_rate != null ? ` · ${card.meta_win_rate}% побед` : ""}
        </p>
      </div>
    </div>
  );
}
