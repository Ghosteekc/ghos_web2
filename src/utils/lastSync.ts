const LAST_SYNC_KEY = "ghosteek-last-sync-at";
export const LAST_SYNC_EVENT = "app:last-sync";

export function getLastSyncAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export function setLastSyncAt(date = new Date()): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(date.getTime()));
    window.dispatchEvent(new Event(LAST_SYNC_EVENT));
  } catch {
    /* private mode / quota */
  }
}

export function formatLastSyncLabel(ts: number | null): string | null {
  if (!ts) return null;
  const time = new Date(ts).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Последняя синхронизация в ${time}`;
}
