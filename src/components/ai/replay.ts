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
  imageBase64?: string | null;
};

export type ReplayVisualMomentView = {
  timestampSeconds: number;
  eventType: string;
  title: string;
  shortDescription: string | null;
  cardName: string | null;
  confidence: number;
  previewBase64: string | null;
  evidenceId: string | null;
  clipId: string | null;
  clipAvailable: boolean;
};

export type ReplayAnalysisView = {
  coachSummary: string;
  groundedLimitations: string | null;
  improvements: string[];
  positives: string[];
  moments: ReplayTimelineMoment[];
  visualMoments: ReplayVisualMomentView[];
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
  unavailable: "Разбор видео сейчас временно недоступен. Попробуй чуть позже.",
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
      return "Не удалось выделить достаточно кадров из видео. Попробуй запись повыше качеством, с видимой ареной.";
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

/** @deprecated Prefer formatReplayConfidenceLabel for UI. Kept for callers expecting %. */
export function formatReplayConfidencePercent(confidence: number | null | undefined): string | null {
  return formatReplayConfidenceLabel(confidence);
}

/** User-facing confidence: высокая / средняя / низкая (no raw %). */
export function formatReplayConfidenceLabel(confidence: number | null | undefined): string | null {
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence <= 0) {
    return null;
  }
  const value = confidence > 1 ? confidence / 100 : confidence;
  if (value >= 0.75) return "высокая";
  if (value >= 0.45) return "средняя";
  return "низкая";
}

export function formatReplayFramesLabel(frames: number | null | undefined): string | null {
  if (typeof frames !== "number" || !Number.isFinite(frames) || frames <= 0) return null;
  const n = Math.round(frames);
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "кадров";
  if (mod10 === 1 && mod100 !== 11) word = "кадр";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "кадра";
  return `${n} ${word}`;
}

const INSUFFICIENT_COACH_SUMMARY =
  "Реплей распознался, но по этому видео я пока не могу надёжно определить сыгранные карты и конкретные моменты. Поэтому не буду придумывать разбор из воздуха.\n\nПопробуй отправить запись в более высоком качестве или с полностью видимой ареной и панелью карт.";

const WITH_MOMENTS_LEAD =
  "Я нашёл несколько моментов, которые можно разобрать уверенно. Вот что бросается в глаза.";

const TECHNICAL_COACH_RE =
  /grounded|confirmed\s+event|event\(s\)|card\s+interval|unknown\s+gaps|confidence\s*[≥>=]|source\s*=\s*heuristic|event_type|card_play|card-level|database[- ]counter|timeline\s+remain|\bplays\b|heuristic|observation_type|frame_index|ReplayEvent|ReplayFacts|TimelineObservation|дождитесь\s+подтвержд/i;

function isTechnicalCoachLine(text: string): boolean {
  return TECHNICAL_COACH_RE.test(text);
}

function stripTechnicalFragments(text: string): string {
  return text
    .replace(/Grounded\s+replay\s+analysis\s*:[^.!?\n]*(?:[.!?]\s*|\n+|$)/gi, "")
    .replace(/Unknown\s+gaps\s*:[^.!?\n]*(?:[.!?]\s*|\n+|$)/gi, "")
    .replace(/\b\d+\s+confirmed\s+event\(s\)[^.!?\n]*/gi, "")
    .replace(/\b\d+\s+confirmed\s+card\s+interval\(s\)[^.!?\n]*/gi, "")
    .replace(/Дождитесь\s+подтверждённых\s+карт[^.!?\n]*(?:[.!?]\s*|\n+|$)/gi, "")
    .replace(/\(confidence\s*[≥>=]\s*0\.90\)/gi, "")
    .replace(/source\s*=\s*heuristic/gi, "")
    .replace(/\bevent_type\s*[:=]\s*\w+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function humanizeCoachSummary(raw: string, options?: { hasMoments?: boolean }): string {
  const hasMoments = Boolean(options?.hasMoments);
  const text = (raw || "").trim();
  if (!text || isTechnicalCoachLine(text)) {
    return hasMoments ? WITH_MOMENTS_LEAD : INSUFFICIENT_COACH_SUMMARY;
  }
  const cleaned = stripTechnicalFragments(text);
  if (!cleaned || isTechnicalCoachLine(cleaned)) {
    return hasMoments ? WITH_MOMENTS_LEAD : INSUFFICIENT_COACH_SUMMARY;
  }
  return cleaned;
}

function humanizeImprovementLines(
  lines: string[],
  options?: { hasEvidence?: boolean },
): string[] {
  const hasEvidence = Boolean(options?.hasEvidence);
  const out = lines
    .map((x) => x.trim())
    .filter(Boolean)
    .map(stripTechnicalFragments)
    .filter(Boolean)
    .filter((x) => !isTechnicalCoachLine(x))
    .filter((x) => !/дождитесь\s+подтвержд/i.test(x))
    .filter((x) => !/confidence\s*[≥>=]|card-level|confirmed events\/cards|\bunknown\b/i.test(x));
  if (out.length > 0) return out.slice(0, 6);
  if (hasEvidence) {
    return ["Опирайся на то, что уже видно уверенно — остальное пока не угадываю."];
  }
  return [
    "Попробуй отправить запись в более высоком качестве или с полностью видимой ареной и панелью карт.",
  ];
}

type ApiEvent = {
  timestamp_seconds: number;
  event_type: string;
  player?: string;
  card_id?: string | null;
  confidence?: number;
  source?: string;
};

const EVENT_TITLE_RU: Record<string, string> = {
  battle_started: "Начало боя",
  battle_start: "Начало боя",
  battle_ended: "Конец боя",
  battle_end: "Конец боя",
  overtime_started: "Овертайм",
  overtime_visible: "Овертайм",
  result_visible: "Экран результата",
  card_visible: "Карта на экране",
  card_identity_visible: "Карта на экране",
  card_play_candidate: "Возможный розыгрыш",
  card_play: "Розыгрыш",
  card_play_confirmed: "Розыгрыш",
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
  if (
    type === "card_visible" ||
    type === "card_identity_visible" ||
    type === "card_play_candidate" ||
    type === "card_play" ||
    type === "card_play_confirmed"
  ) {
    if (!cardName) return null;
    return {
      timestampSeconds: Number(ev.timestamp_seconds) || 0,
      title: cardName,
      cardName,
      kind: type === "card_play_candidate" ? "candidate" : "confirmed",
    };
  }
  // HUD-only visibility signals stay in API facts — not shown as timeline jargon.
  if (
    type === "card_bar_visible" ||
    type === "battle_ui_visible" ||
    type === "arena_visible" ||
    type === "elixir_hud_visible"
  ) {
    return null;
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
  const candidateEvents = Array.isArray(facts.candidate_events)
    ? facts.candidate_events
    : allEvents.filter((ev) => ev.event_type === "card_play_candidate");

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
  for (const ev of candidateEvents) {
    if (ev.event_type !== "card_play_candidate") continue;
    push(momentFromEvent(ev, "candidate", confirmedCards));
  }

  moments.sort((a, b) => a.timestampSeconds - b.timestampSeconds || a.kind.localeCompare(b.kind));

  const shots = Array.isArray(facts.moment_shots) ? facts.moment_shots : [];
  for (const shot of shots) {
    if (!shot || typeof shot.image_base64 !== "string" || !shot.image_base64.trim()) continue;
    const ts = Number(shot.timestamp_seconds) || 0;
    const kind: ReplayTimelineKind = shot.kind === "candidate" ? "candidate" : "confirmed";
    const label =
      typeof shot.label === "string" && shot.label.trim() ? shot.label.trim() : "Момент";
    const existing = moments.find(
      (m) => Math.abs(m.timestampSeconds - ts) < 0.15 && m.kind === kind,
    );
    if (existing) {
      existing.imageBase64 = shot.image_base64.trim();
      continue;
    }
    moments.push({
      timestampSeconds: ts,
      title: label,
      cardName: null,
      kind,
      imageBase64: shot.image_base64.trim(),
    });
  }
  moments.sort((a, b) => a.timestampSeconds - b.timestampSeconds || a.kind.localeCompare(b.kind));

  const visualMoments: ReplayVisualMomentView[] = [];
  const rawVisual = Array.isArray(facts.visual_moments) ? facts.visual_moments : [];
  for (const vm of rawVisual.slice(0, 6)) {
    if (!vm || typeof vm !== "object") continue;
    const eventType = typeof vm.event_type === "string" ? vm.event_type : "unknown";
    if (eventType === "unknown") continue;
    const cardName =
      typeof vm.card_name === "string" && vm.card_name.trim() ? vm.card_name.trim() : null;
    const apiTitle = typeof vm.title === "string" && vm.title.trim() ? vm.title.trim() : "";
    const title = apiTitle || cardName || "Момент на поле";
    const shortDescription =
      typeof vm.short_description === "string" && vm.short_description.trim()
        ? vm.short_description.trim()
        : null;
    visualMoments.push({
      timestampSeconds: Number(vm.timestamp_seconds) || 0,
      eventType,
      title,
      shortDescription,
      cardName,
      confidence: Number(vm.confidence) || 0,
      previewBase64:
        typeof vm.preview_base64 === "string" && vm.preview_base64.trim()
          ? vm.preview_base64.trim()
          : null,
      evidenceId: typeof vm.evidence_id === "string" ? vm.evidence_id : null,
      clipId: typeof vm.clip_id === "string" ? vm.clip_id : null,
      clipAvailable: Boolean(vm.clip_available),
    });
  }

  const hasEvidence =
    moments.length > 0 || confirmedCardNames.length > 0 || visualMoments.length > 0;
  const groundedSummary =
    typeof facts.grounded_summary === "string" ? facts.grounded_summary.trim() : "";
  const groundedLimitations =
    typeof facts.grounded_limitations === "string" && facts.grounded_limitations.trim()
      ? facts.grounded_limitations.trim()
      : null;
  const coachSummary = humanizeCoachSummary(
    groundedSummary || facts.coach_reply || tactical?.summary || "",
    {
      hasMoments: hasEvidence,
    },
  );
  const improvements = humanizeImprovementLines(
    [...parseStringList(tactical?.recommendations, 6), ...parseStringList(tactical?.possible_mistakes, 4)],
    { hasEvidence },
  );
  const positives = parseStringList(tactical?.positive_actions, 6)
    .map(stripTechnicalFragments)
    .filter(Boolean)
    .filter((x) => !isTechnicalCoachLine(x));

  if (
    !coachSummary &&
    improvements.length === 0 &&
    moments.length === 0 &&
    positives.length === 0 &&
    visualMoments.length === 0
  ) {
    return null;
  }

  return {
    coachSummary:
      coachSummary || (hasEvidence ? WITH_MOMENTS_LEAD : INSUFFICIENT_COACH_SUMMARY),
    groundedLimitations,
    improvements: hasEvidence ? improvements : improvements.slice(0, 1),
    positives: hasEvidence ? positives : [],
    moments: moments.slice(0, 14),
    visualMoments,
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
    imageBase64: typeof raw.imageBase64 === "string" ? raw.imageBase64 : null,
  };
}

function parseAnalysis(raw: unknown): ReplayAnalysisView | null {
  if (!isRecord(raw)) return null;
  const coachSummary = typeof raw.coachSummary === "string" ? raw.coachSummary.trim() : "";
  const groundedLimitations =
    typeof raw.groundedLimitations === "string" && raw.groundedLimitations.trim()
      ? raw.groundedLimitations.trim()
      : null;
  const improvements = parseStringList(raw.improvements, 8);
  const positives = parseStringList(raw.positives, 8);
  const moments = Array.isArray(raw.moments)
    ? raw.moments.map(parseMoment).filter((m): m is ReplayTimelineMoment => Boolean(m))
    : [];
  const visualMoments = Array.isArray(raw.visualMoments)
    ? raw.visualMoments
        .map(parseVisualMoment)
        .filter((m): m is ReplayVisualMomentView => Boolean(m))
    : [];
  const confirmedCardNames = parseStringList(raw.confirmedCardNames, 8);
  if (
    !coachSummary &&
    improvements.length === 0 &&
    moments.length === 0 &&
    positives.length === 0 &&
    visualMoments.length === 0
  ) {
    return null;
  }
  const hasEvidence =
    moments.length > 0 || confirmedCardNames.length > 0 || visualMoments.length > 0;
  return {
    coachSummary: humanizeCoachSummary(
      coachSummary || (hasEvidence ? WITH_MOMENTS_LEAD : INSUFFICIENT_COACH_SUMMARY),
      { hasMoments: hasEvidence },
    ),
    groundedLimitations,
    improvements: humanizeImprovementLines(improvements, { hasEvidence }),
    positives: positives
      .map(stripTechnicalFragments)
      .filter(Boolean)
      .filter((x) => !isTechnicalCoachLine(x)),
    moments,
    visualMoments,
    confirmedCardNames,
  };
}

function parseVisualMoment(raw: unknown): ReplayVisualMomentView | null {
  if (!isRecord(raw)) return null;
  const eventType = typeof raw.eventType === "string" ? raw.eventType.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : eventType;
  if (!eventType && !title) return null;
  return {
    timestampSeconds: Number(raw.timestampSeconds) || 0,
    eventType: eventType || "unknown",
    title: title || eventType || "Момент",
    shortDescription:
      typeof raw.shortDescription === "string" && raw.shortDescription.trim()
        ? raw.shortDescription.trim()
        : null,
    cardName: typeof raw.cardName === "string" ? raw.cardName : null,
    confidence: Number(raw.confidence) || 0,
    previewBase64: typeof raw.previewBase64 === "string" ? raw.previewBase64 : null,
    evidenceId: typeof raw.evidenceId === "string" ? raw.evidenceId : null,
    clipId: typeof raw.clipId === "string" ? raw.clipId : null,
    clipAvailable: Boolean(raw.clipAvailable),
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
