import { useEffect, useState } from "react";
import { Clapperboard, X } from "lucide-react";
import { api } from "@/api/client";
import { CardTile } from "@/components/cards";
import {
  formatReplayConfidenceLabel,
  formatReplayDuration,
  formatReplayFramesLabel,
  formatReplayMomentTime,
  type AiReplayCardData,
  type ReplayVisualMomentView,
} from "@/components/ai/replay";
import { Button } from "@/components/ui";
import { cn } from "@/utils";

type Props = {
  card: AiReplayCardData;
  onAnalyzeAnother?: () => void;
};

function ReplayEvidenceClip({
  clipId,
  fallbackBase64,
}: {
  clipId: string;
  fallbackBase64: string | null;
}) {
  const [src, setSrc] = useState<string | null>(
    fallbackBase64 ? `data:image/jpeg;base64,${fallbackBase64}` : null,
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const blob = await api.fetchReplayEvidence(clipId);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        /* keep frame fallback */
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [clipId]);

  if (!src) return null;
  return <img src={src} alt="" />;
}

export function ReplayAnalysisCard({ card, onAnalyzeAnother }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<ReplayVisualMomentView | null>(null);
  const analysis = card.analysis;
  if (!analysis) return null;

  const confidenceLabel = formatReplayConfidenceLabel(card.confidence);
  const framesLabel = formatReplayFramesLabel(card.framesAnalyzed);
  const visualMoments = analysis.visualMoments ?? [];

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

      {analysis.groundedLimitations ? (
        <section className="ai-replay-section">
          <h3 className="ai-replay-section-title">Ограничения анализа</h3>
          <p className="ai-replay-section-body whitespace-pre-wrap">{analysis.groundedLimitations}</p>
        </section>
      ) : null}

      {visualMoments.length > 0 ? (
        <section className="ai-replay-section">
          <h3 className="ai-replay-section-title">Ключевые моменты</h3>
          <ul className="ai-replay-visual-list">
            {visualMoments.map((m, i) => (
              <li key={`${m.eventType}-${m.timestampSeconds}-${i}`}>
                <button
                  type="button"
                  className="ai-replay-visual-btn"
                  onClick={() => setLightbox(m)}
                >
                  {m.previewBase64 ? (
                    <img
                      className="ai-replay-visual-thumb"
                      src={`data:image/jpeg;base64,${m.previewBase64}`}
                      alt={m.title}
                      loading="lazy"
                    />
                  ) : (
                    <span className="ai-replay-visual-thumb ai-replay-visual-thumb--empty" />
                  )}
                  <span className="ai-replay-visual-meta">
                    <span className="ai-replay-tl-time">
                      {formatReplayMomentTime(m.timestampSeconds)}
                    </span>
                    <span className="ai-replay-tl-title">{m.title}</span>
                    {m.shortDescription ? (
                      <span className="ai-replay-visual-sub">{m.shortDescription}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : previewMoments.length > 0 ? (
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
                <div className="ai-replay-tl-row">
                  <span className="ai-replay-tl-time">{formatReplayMomentTime(m.timestampSeconds)}</span>
                  <span className="ai-replay-tl-title">{m.title}</span>
                </div>
                {m.imageBase64 ? (
                  <img
                    className="ai-replay-tl-shot"
                    src={`data:image/jpeg;base64,${m.imageBase64}`}
                    alt={m.title}
                    loading="lazy"
                  />
                ) : null}
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

      {lightbox ? (
        <div
          className="ai-replay-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="ai-replay-lightbox-close"
            aria-label="Закрыть"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="ai-replay-lightbox-body" onClick={(e) => e.stopPropagation()}>
            {lightbox.clipAvailable && lightbox.clipId ? (
              <ReplayEvidenceClip clipId={lightbox.clipId} fallbackBase64={lightbox.previewBase64} />
            ) : lightbox.previewBase64 ? (
              <img
                src={`data:image/jpeg;base64,${lightbox.previewBase64}`}
                alt={lightbox.title}
              />
            ) : null}
            <p className="ai-replay-lightbox-caption">
              {formatReplayMomentTime(lightbox.timestampSeconds)} · {lightbox.title}
              {lightbox.shortDescription ? ` — ${lightbox.shortDescription}` : null}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
