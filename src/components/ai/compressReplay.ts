/** Client-side replay shrink before upload. Duration is preserved. */

import { REPLAY_CLIENT_COMPRESS_OVER_BYTES, REPLAY_MAX_DURATION_SECONDS } from "@/components/ai/replay";

const TARGET_SHORT_SIDE = 720;
const MAX_BITRATE = 1_800_000;
const MIN_BITRATE = 600_000;
const TARGET_BYTES = 70 * 1024 * 1024;

export class ReplayClientError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export async function compressReplayVideo(file: File): Promise<File> {
  if (file.size <= REPLAY_CLIENT_COMPRESS_OVER_BYTES) return file;
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") return file;

  try {
    return await transcodeWithRecorder(file);
  } catch (err) {
    if (err instanceof ReplayClientError) throw err;
    return file;
  }
}

function even(value: number): number {
  const n = Math.max(2, Math.round(value));
  return n % 2 === 0 ? n : n - 1;
}

function scaledSize(width: number, height: number): { width: number; height: number } {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const shortest = Math.min(w, h);
  if (shortest <= TARGET_SHORT_SIDE) return { width: even(w), height: even(h) };
  const scale = TARGET_SHORT_SIDE / shortest;
  return { width: even(Math.max(2, w * scale)), height: even(Math.max(2, h * scale)) };
}

function pickRecorderMime(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function outputName(original: string, mime: string): string {
  const base = original.replace(/\\/g, "/").split("/").pop() || "replay";
  const stem = base.replace(/\.[^.]+$/, "") || "replay";
  const ext = mime.includes("mp4") ? ".mp4" : ".webm";
  return `${stem}${ext}`;
}

function outputMime(recorderMime: string): string {
  return recorderMime.includes("mp4") ? "video/mp4" : "video/webm";
}

async function transcodeWithRecorder(file: File): Promise<File> {
  const mime = pickRecorderMime();
  if (!mime || typeof HTMLCanvasElement === "undefined") return file;

  const url = URL.createObjectURL(file);
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden";

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;

  const canvas = document.createElement("canvas");
  wrap.append(video, canvas);
  document.body.append(wrap);

  try {
    await waitForMeta(video);
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return file;
    if (duration > REPLAY_MAX_DURATION_SECONDS) {
      throw new ReplayClientError("REPLAY_TOO_LONG");
    }
    // Long clips: FFmpeg on the bot is faster than realtime MediaRecorder.
    if (duration > 180) return file;
    if (!video.videoWidth || !video.videoHeight) return file;

    const size = scaledSize(video.videoWidth, video.videoHeight);
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return file;
    if (typeof canvas.captureStream !== "function") return file;

    const bitrate = Math.min(
      MAX_BITRATE,
      Math.max(MIN_BITRATE, Math.floor((TARGET_BYTES * 8) / duration)),
    );
    const timeoutMs = Math.min(180_000, Math.max(20_000, duration * 1000 + 12_000));
    const blob = await recordCanvas(video, canvas, ctx, size, mime, bitrate, timeoutMs);
    if (blob.size <= 0 || blob.size >= file.size) return file;
    return new File([blob], outputName(file.name, mime), { type: outputMime(mime) });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    wrap.remove();
    URL.revokeObjectURL(url);
  }
}

async function recordCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  mime: string,
  bitrate: number,
  timeoutMs: number,
): Promise<Blob> {
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  let timeoutHandle = 0;
  const timedOut = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => reject(new Error("compress-timeout")), timeoutMs);
  });

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("compress-record"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: outputMime(mime) }));
  });

  const draw = () => {
    if (video.ended || video.paused) return;
    ctx.drawImage(video, 0, 0, size.width, size.height);
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(draw);
    } else {
      requestAnimationFrame(draw);
    }
  };

  try {
    recorder.start(250);
    await video.play();
    draw();
    await Promise.race([waitForEnded(video), timedOut]);
    ctx.drawImage(video, 0, 0, size.width, size.height);
    if (recorder.state === "recording") recorder.stop();
    return await Promise.race([recorded, timedOut]);
  } finally {
    window.clearTimeout(timeoutHandle);
    if (recorder.state === "recording") {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    for (const track of stream.getTracks()) track.stop();
  }
}

function waitForMeta(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1 && Number.isFinite(video.duration)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error("compress-meta"));
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    video.addEventListener("error", fail, { once: true });
  });
}

function waitForEnded(video: HTMLVideoElement): Promise<void> {
  if (video.ended) return Promise.resolve();
  return new Promise((resolve, reject) => {
    video.addEventListener("ended", () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("compress-play")), { once: true });
  });
}
