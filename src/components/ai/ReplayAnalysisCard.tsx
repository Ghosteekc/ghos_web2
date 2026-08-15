import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { CardTile } from "@/components/cards";
import {
  formatReplayConfidenceLabel,
  formatReplayDuration,
  formatReplayFramesLabel,
  formatReplayMomentTime,
  type AiReplayCardData,
} from "@/components/ai/replay";
import { Button } from "@/components/ui";
import { cn } from "@/utils";

type Props = {
  card: AiReplayCardData;
  onAnalyzeAnother?: () => void;
};

export function ReplayAnalysisCard({ card, onAnalyzeAnother }: Props) {
  const [expanded, setExpanded] = useState(false);
  const analysis = card.analysis;
  if (!analysis) return null;

  const confidenceLabel = formatReplayConfidenceLabel(card.confidence);
  const framesLabel = formatReplayFramesLabel(card.framesAnalyzed);

  const previewMoments = analysis.moments.slice(0, expanded ? analysis.moments.length : 6);
  const previewImprovements = analysis.improvements.slice(
    0,
    expanded ? analysis.improvements.length : 3,
  );
  const showMore =
    analysis.positives.length > 0 ||
    analysis.improvements.length > 3 ||
    analysis.moments.length > 6 ||
    analysis.confirmedCardNames.length > 0;

  return (
    <div className="ai-deck-card ai-replay-analysis ai-replay-analysis-enter">
      <div className="ai-replay-analysis-head">
        <div className="min-w-0 flex-1">
          <p className="ai-deck-card-title">Replay analysis</p>
          <p className="ai-replay-filename truncate">Clash Royale replay</p>
          <div className="ai-deck-card-tags">
            <span className="ai-deck-card-tag">{formatReplayDuration(card.durationSeconds)}</span>
            {framesLabel ? <span className="ai-deck-card-tag">{framesLabel}</span> : null}
            {confidenceLabel ? (
              <span className="ai-deck-card-tag">Уверенность анализа: {confidenceLabel}</span>
            ) : null}
          </div>
        </div>
        <div className="ai-replay-preview" aria-hidden>
          <Clapperboard className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>

      {analysis.coachSummary ? (
        <section className="ai-replay-section">
          <h3 className="ai-replay-section-title">Краткий вывод тренера</h3>
          <p className="ai-replay-section-body whitespace-pre-wrap">{analysis.coachSummary}</p>
        </section>
      ) : null}

      {previewMoments.length > 0 ? (
        <section className="ai-replay-section">
          <h3 className="ai-replay-section-title">Ключевые моменты</h3>
          <ol className="ai-replay-timeline">
            {previewMoments.map((m, i) => (
              <li
                key={`${m.kind}-${m.timestampSeconds}-${m.title}-${i}`}
                className={cn(
                  "ai-replay-tl-item",
                  m.kind === "candidate"
                    ? "ai-replay-tl-item--candidate"
                    : "ai-replay-tl-item--confirmed",
                )}
              >
                <span className="ai-replay-tl-time">{formatReplayMomentTime(m.timestampSeconds)}</span>
                <span className="ai-replay-tl-title">{m.title}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {previewImprovements.length > 0 ? (
        <section className="ai-replay-section">
          <h3 className="ai-replay-section-title">Что улучшить</h3>
          <ul className="ai-replay-list">
            {previewImprovements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {expanded ? (
        <>
          {analysis.positives.length > 0 ? (
            <section className="ai-replay-section">
              <h3 className="ai-replay-section-title">Что получилось</h3>
              <ul className="ai-replay-list">
                {analysis.positives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {analysis.confirmedCardNames.length > 0 ? (
            <section className="ai-replay-section">
              <h3 className="ai-replay-section-title">Карты в разборе</h3>
              <div className="ai-replay-cards">
                {analysis.confirmedCardNames.map((name) => (
                  <div key={name} className="ai-replay-card-tile min-w-0 overflow-hidden">
                    <CardTile name={name} size="deck" showLabel={false} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <div className="ai-replay-actions">
        {showMore ? (
          <Button
            type="button"
            variant="secondary"
            className="ai-replay-action-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Свернуть" : "Подробнее"}
          </Button>
        ) : null}
        {onAnalyzeAnother ? (
          <Button
            type="button"
            variant="secondary"
            className="ai-replay-action-btn"
            onClick={onAnalyzeAnother}
          >
            Разобрать другой реплей
          </Button>
        ) : null}
      </div>
    </div>
  );
}
