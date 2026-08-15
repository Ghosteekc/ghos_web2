/** Replay upload UX helpers + analysis card view models. */

import type { ReplayAnalyzeSuccess } from "@/api/client";

export const REPLAY_MAX_SIZE_BYTES = 250 * 1024 * 1024;
export const REPLAY_CLIENT_COMPRESS_OVER_BYTES = 32 * 1024 * 1024;
export const REPLAY_MAX_DURATION_SECONDS = 8 * 60;

export const REPLAY_ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov"] as const;
export const REPLAY_ALLOWED_MIME = ["video/mp4", "video/webm", "video/quicktime"] as const;

export type ReplayStatus =
  | "idle"
  | "selecting"
  | "compressing"
  | "uploading"
  | "validating"
  | "validated"
  | "cr_replay"
  | "not_cr"
  | "uncertain"
  | "error";

export function isReplayBusyStatus(status: ReplayStatus): boolean {
  return status === "compressing" || status === "uploading" || status === "validating";
}

export type ReplayDetectionStatus = "cr_replay" | "not_cr_replay" | "uncertain";

export type ReplayTimelineKind = "confirmed" | "candidate";

/** Compact timeline row for the analysis card (no internals). */
export type ReplayTimelineMoment = {
  timestampSeconds: number;
  title: string;
  cardName?: string | null;
  kind: ReplayTimelineKind;
};

export type ReplayAnalysisView = {
  coachSummary: string;
  improvements: string[];
  positives: string[];
  moments: ReplayTimelineMoment[];
  confirmedCardNames: string[];
};

export type AiReplayCardData = {
  filename: string;
  durationSeconds: number;
  width: number;
  height: number;
  accepted: boolean;
  detectionStatus?: ReplayDetectionStatus | null;
  confidence?: number | null;
  framesAnalyzed?: number | null;
  hasLimitations?: boolean;
  analysis?: ReplayAnalysisView | null;
};

export const REPLAY_MSG = {
  notVideo: "Нужен именно видеофайл с записью боя Clash Royale.",
  checking: "Проверяю видео…",
  compressing: "Загружаю и сжимаю видео…",
  analyzing: "Разбираю реплей…",
  accepted: "Видео принято. Проверяю, похоже ли оно на реплей Clash Royale…",
  crReplay:
    "🎥 Похоже, это реплей Clash Royale.\nСтруктура видео собрана. Точные действия игроков — на следующем этапе.",
  analysisReady: "Разбор реплея готов.",
  factsLimited:
    "Пока вижу структуру видео. Точные розыгрыши карт появятся, когда сигналов будет больше.",
  notCr: "Похоже, это не реплей Clash Royale. Пришли запись боя из игры.",
  uncertain:
    "Не смог уверенно определить Clash Royale на видео. Если это запись боя, попробуй отправить видео целиком и без сильного сжатия.",
  tooLarge: "Видео слишком большое. Максимум для загрузки — 250 МБ.",
  tooLong: "Видео слишком длинное. Для разбора реплея используй запись до 8 минут.",
  busy: "Сейчас уже проверяется другой реплей. Подожди немного.",
  invalidVideo: "Не удалось прочитать видео. Пришли запись боя из Clash Royale.",
  unavailable: "Сейчас не получается проверить видео. Попробуй позже.",
  prepareFailed: "Не удалось подготовить видео для анализа. Попробуй отправить его ещё раз.",
  internal: "Не удалось проверить видео. Попробуй ещё раз.",
} as const;

export function fileExtension(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() || name;
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot).toLowerCase();
}

export function isAllowedReplayVideo(file: File): boolean {
  const mime = (file.type || "").split(";")[0].trim().toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("text/") || mime.startsWith("audio/")) {
    return false;
  }
  const ext = fileExtension(file.name);
  const extOk = (REPLAY_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  const mimeOk = (REPLAY_ALLOWED_MIME as readonly string[]).includes(mime);
  return extOk || mimeOk;
}

export function replayErrorMessage(code: string): string {
  switch (code) {
    case "REPLAY_INVALID_FORMAT":
      return REPLAY_MSG.notVideo;
    case "REPLAY_TOO_LARGE":
      return REPLAY_MSG.tooLarge;
    case "REPLAY_TOO_LONG":
      return REPLAY_MSG.tooLong;
    case "REPLAY_BUSY":
      return REPLAY_MSG.busy;
    case "REPLAY_FFMPEG_UNAVAILABLE":
      return REPLAY_MSG.unavailable;
    case "REPLAY_INVALID_VIDEO":
      return REPLAY_MSG.invalidVideo;
    case "REPLAY_NOT_CR":
      return REPLAY_MSG.notCr;
    case "REPLAY_FRAME_EXTRACTION_FAILED":
    case "REPLAY_FRAME_ANALYSIS_FAILED":
    case "REPLAY_ANALYSIS_TIMEOUT":
    case "REPLAY_COMPRESS_FAILED":
      return REPLAY_MSG.prepareFailed;
    case "REPLAY_INTERNAL_ERROR":
      return REPLAY_MSG.internal;
    default:
      return REPLAY_MSG.internal;
  }
}

export function replayDetectionMessage(status: string, hasAnalysis = false): string {
  if (status === "cr_replay" && hasAnalysis) return REPLAY_MSG.analysisReady;
  if (status === "cr_replay") return REPLAY_MSG.crReplay;
  if (status === "not_cr_replay") return REPLAY_MSG.notCr;
  if (status === "uncertain") return REPLAY_MSG.uncertain;
  return REPLAY_MSG.accepted;
}

export function replayStatusFromApi(status: string): ReplayStatus {
  if (status === "cr_replay") return "cr_replay";
  if (status === "not_cr_replay") return "not_cr";
  if (status === "uncertain") return "uncertain";
  return "validated";
}

export function formatReplayDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatReplayMomentTime(seconds: number): string {
  const t = Math.max(0, Number(seconds) || 0);
  return `${t.toFixed(1)}s`;
}

export function formatReplayConfidencePercent(confidence: number | null | undefined): string | null {
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence <= 0) {
    return null;
  }
  const pct = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
  if (pct <= 0) return null;
  return `${Math.min(100, pct)}%`;
}

type ApiEvent = NonNullable<NonNullable<ReplayAnalyzeSuccess["replay_facts"]>["events"]>[number];

const EVENT_TITLE_RU: Record<string, string> = {
  battle_started: "Начало боя",
  battle_ended: "Конец боя",
  overtime_started: "Овертайм",
  result_visible: "Экран результата",
  card_visible: "Карта на экране",
  card_play_candidate: "Возможный розыгрыш",
};

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === "object";
}

function parseStringList(raw: unknown, limit = 8): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, limit);
}

function cardNameById(
  cardId: string | null | undefined,
  cards: { card_id: string; card_name: string }[],
): string | null {
  if (!cardId) return null;
  const hit = cards.find((c) => c.card_id === cardId);
  return hit?.card_name?.trim() || null;
}

function momentFromEvent(
  ev: ApiEvent,
  kind: ReplayTimelineKind,
  cards: { card_id: string; card_name: string }[],
): ReplayTimelineMoment | null {
  const type = ev.event_type;
  if (!type || type === "unknown") return null;

  const cardName = cardNameById(ev.card_id, cards);
  if (type === "card_visible" || type === "card_play_candidate") {
    if (!cardName) return null;
    return {
      timestampSeconds: Number(ev.timestamp_seconds) || 0,
      title: cardName,
      cardName,
      kind,
    };
  }

  const title = EVENT_TITLE_RU[type];
  if (!title) return null;
  return {
    timestampSeconds: Number(ev.timestamp_seconds) || 0,
    title,
    cardName,
    kind,
  };
}

/** Build player-facing analysis from API facts. Drops unknowns / internals. */
export function buildReplayAnalysis(
  facts: ReplayAnalyzeSuccess["replay_facts"] | null | undefined,
): ReplayAnalysisView | null {
  if (!facts) return null;

  const tactical = facts.tactical_analysis ?? null;
  const coachSummary = (facts.coach_reply || tactical?.summary || "").trim();
  const improvements = [
    ...parseStringList(tactical?.recommendations, 6),
    ...parseStringList(tactical?.possible_mistakes, 4),
  ].slice(0, 6);
  const positives = parseStringList(tactical?.positive_actions, 6);
  const confirmedCards = Array.isArray(facts.confirmed_cards) ? facts.confirmed_cards : [];
  const confirmedCardNames = confirmedCards
    .map((c) => (typeof c.card_name === "string" ? c.card_name.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);

  const confirmedRaw = Array.isArray(facts.confirmed_events)
    ? facts.confirmed_events
    : Array.isArray(facts.battle_timeline?.confirmed_events)
      ? facts.battle_timeline.confirmed_events
      : [];
  const allEvents = Array.isArray(facts.events) ? facts.events : [];

  const moments: ReplayTimelineMoment[] = [];
  const seen = new Set<string>();

  const push = (m: ReplayTimelineMoment | null) => {
    if (!m) return;
    const key = `${m.kind}|${m.timestampSeconds.toFixed(1)}|${m.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    moments.push(m);
  };

  for (const ev of confirmedRaw) {
    push(momentFromEvent(ev, "confirmed", confirmedCards));
  }
  for (const ev of allEvents) {
    if (ev.event_type !== "card_play_candidate") continue;
    push(momentFromEvent(ev, "candidate", confirmedCards));
  }

  moments.sort((a, b) => a.timestampSeconds - b.timestampSeconds || a.kind.localeCompare(b.kind));

  if (!coachSummary && improvements.length === 0 && moments.length === 0 && positives.length === 0) {
    return null;
  }

  return {
    coachSummary:
      coachSummary ||
      (moments.length > 0
        ? "Собрал ключевые моменты по видео. Ниже — что видно уверенно."
        : "Пока мало подтверждённых сигналов для полного разбора."),
    improvements,
    positives,
    moments: moments.slice(0, 14),
    confirmedCardNames,
  };
}

function parseMoment(raw: unknown): ReplayTimelineMoment | null {
  if (!isRecord(raw)) return null;
  const kind = raw.kind === "candidate" ? "candidate" : raw.kind === "confirmed" ? "confirmed" : null;
  if (!kind || typeof raw.title !== "string" || !raw.title.trim()) return null;
  return {
    timestampSeconds: Number(raw.timestampSeconds) || 0,
    title: raw.title.trim(),
    cardName: typeof raw.cardName === "string" ? raw.cardName : null,
    kind,
  };
}

function parseAnalysis(raw: unknown): ReplayAnalysisView | null {
  if (!isRecord(raw)) return null;
  const coachSummary = typeof raw.coachSummary === "string" ? raw.coachSummary.trim() : "";
  const improvements = parseStringList(raw.improvements, 8);
  const positives = parseStringList(raw.positives, 8);
  const moments = Array.isArray(raw.moments)
    ? raw.moments.map(parseMoment).filter((m): m is ReplayTimelineMoment => Boolean(m))
    : [];
  const confirmedCardNames = parseStringList(raw.confirmedCardNames, 8);
  if (!coachSummary && improvements.length === 0 && moments.length === 0 && positives.length === 0) {
    return null;
  }
  return {
    coachSummary:
      coachSummary || "Собрал ключевые моменты по видео. Ниже — что видно уверенно.",
    improvements,
    positives,
    moments,
    confirmedCardNames,
  };
}

export function parseReplayCard(raw: unknown): AiReplayCardData | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.filename !== "string" || !raw.filename.trim()) return null;
  const detectionRaw = raw.detectionStatus;
  const detectionStatus =
    detectionRaw === "cr_replay" || detectionRaw === "not_cr_replay" || detectionRaw === "uncertain"
      ? detectionRaw
      : null;
  return {
    filename: raw.filename,
    durationSeconds: Number(raw.durationSeconds) || 0,
    width: Number(raw.width) || 0,
    height: Number(raw.height) || 0,
    accepted: raw.accepted !== false,
    detectionStatus,
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
    framesAnalyzed: typeof raw.framesAnalyzed === "number" ? raw.framesAnalyzed : null,
    hasLimitations: raw.hasLimitations === true,
    analysis: parseAnalysis(raw.analysis),
  };
}
