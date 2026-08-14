/** Client no longer re-encodes replays — MediaRecorder broke CR HUD detection. */

import { REPLAY_MAX_DURATION_SECONDS } from "@/components/ai/replay";

export class ReplayClientError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/** Keep the original file. Server FFmpeg compresses after upload. */
export async function compressReplayVideo(file: File): Promise<File> {
  if (typeof document === "undefined") return file;

  try {
    const duration = await peekDuration(file);
    if (duration != null && duration > REPLAY_MAX_DURATION_SECONDS) {
      throw new ReplayClientError("REPLAY_TOO_LONG");
    }
  } catch (err) {
    if (err instanceof ReplayClientError) throw err;
  }
  return file;
}

function peekDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    video.onloadedmetadata = () => {
      const d = video.duration;
      done(Number.isFinite(d) && d > 0 ? d : null);
    };
    video.onerror = () => done(null);
    video.src = url;
  });
}
