/** Stash last accepted CR replay so /ask follow-ups know it exists. */

export type AcceptedReplayMeta = {
  status: "cr_replay" | "not_cr_replay" | "uncertain";
  filename: string;
  duration_seconds: number;
  width: number;
  height: number;
  confidence?: number | null;
};

const SS_KEY = "ghosteek-ai-replay-context-v1";

export function stashAcceptedReplay(meta: AcceptedReplayMeta): void {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(meta));
  } catch {
    /* private mode */
  }
}

export function peekAcceptedReplay(): AcceptedReplayMeta | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AcceptedReplayMeta;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      parsed.status !== "cr_replay" &&
      parsed.status !== "not_cr_replay" &&
      parsed.status !== "uncertain"
    ) {
      return null;
    }
    if (typeof parsed.filename !== "string" || !parsed.filename.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAcceptedReplay(): void {
  try {
    sessionStorage.removeItem(SS_KEY);
  } catch {
    /* ignore */
  }
}
