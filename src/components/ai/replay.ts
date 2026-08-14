/** Replay upload UX helpers. Stage 3: CR / not CR / uncertain. */

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

export type AiReplayCardData = {
  filename: string;
  durationSeconds: number;
  width: number;
  height: number;
  accepted: boolean;
  detectionStatus?: ReplayDetectionStatus | null;
  confidence?: number | null;
};

export const REPLAY_MSG = {
  notVideo: "Нужен именно видеофайл с записью боя Clash Royale.",
  checking: "Проверяю видео…",
  compressing: "Загружаю и сжимаю видео…",
  accepted: "Видео принято. Проверяю, похоже ли оно на реплей Clash Royale…",
  crReplay:
    "🎥 Похоже, это реплей Clash Royale.\nВидео подготовлено к следующему этапу анализа.",
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

export function replayDetectionMessage(status: string): string {
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

export function parseReplayCard(raw: unknown): AiReplayCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.filename !== "string" || !row.filename.trim()) return null;
  const detectionRaw = row.detectionStatus;
  const detectionStatus =
    detectionRaw === "cr_replay" || detectionRaw === "not_cr_replay" || detectionRaw === "uncertain"
      ? detectionRaw
      : null;
  return {
    filename: row.filename,
    durationSeconds: Number(row.durationSeconds) || 0,
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    accepted: row.accepted !== false,
    detectionStatus,
    confidence: typeof row.confidence === "number" ? row.confidence : null,
  };
}
