import type { AiReplayCardData } from "@/components/ai/replay";
import {
  formatReplayConfidenceLabel,
  formatReplayDuration,
  formatReplayFramesLabel,
  REPLAY_MSG,
} from "@/components/ai/replay";

type Props = {
  card: AiReplayCardData;
};

export function ReplayAcceptedCard({ card }: Props) {
  const sizeLabel =
    card.width > 0 && card.height > 0 ? `${card.width}×${card.height}` : null;
  const status = card.detectionStatus;
  const footer =
    status === "cr_replay"
      ? "✓ Похоже на Clash Royale"
      : status === "uncertain"
        ? "Не уверен — мало HUD-сигналов"
        : status === "not_cr_replay"
          ? "HUD Clash Royale не найден"
          : card.accepted
            ? "✓ Видео принято"
            : null;

  const confidenceLabel = formatReplayConfidenceLabel(card.confidence);
  const framesLabel = formatReplayFramesLabel(card.framesAnalyzed);

  return (
    <div className="ai-deck-card ai-replay-card">
      <div className="ai-deck-card-head">
        <div className="min-w-0 flex-1">
          <p className="ai-deck-card-title">Replay</p>
          <p className="ai-replay-filename truncate">{card.filename}</p>
          <div className="ai-deck-card-tags">
            <span className="ai-deck-card-tag">{formatReplayDuration(card.durationSeconds)}</span>
            {sizeLabel ? <span className="ai-deck-card-tag">{sizeLabel}</span> : null}
            {confidenceLabel ? (
              <span className="ai-deck-card-tag">Уверенность анализа: {confidenceLabel}</span>
            ) : null}
            {framesLabel ? <span className="ai-deck-card-tag">{framesLabel}</span> : null}
          </div>
        </div>
      </div>
      {footer ? (
        <p className={status === "not_cr_replay" || status === "uncertain" ? "ai-replay-note" : "ai-replay-ok"}>
          {footer}
        </p>
      ) : null}
      {status === "cr_replay" && card.hasLimitations ? (
        <p className="ai-replay-note">{REPLAY_MSG.factsLimited}</p>
      ) : null}
    </div>
  );
}
