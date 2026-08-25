const store = new Map<string, { data: unknown; expires: number }>();
const inflight = new Map<string, Promise<unknown>>();

export { inflight };

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheHas(key: string): boolean {
  return cacheGet(key) !== null;
}

export function cacheSet(key: string, data: unknown, ttlMs: number) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function cacheInvalidate(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Clear all ghosteek localStorage cache entries. */
export function lsClearAll() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

const LS_PREFIX = "ghosteek-cache:";

export function lsGet<T>(key: string, ttlMs: number, staleGraceMs = 0): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; expires: number };
    const age = Date.now() - parsed.expires;
    if (age > 0) {
      if (staleGraceMs > 0 && age <= staleGraceMs) {
        return parsed.data;
      }
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function lsSet(key: string, data: unknown, ttlMs: number) {
  try {
    localStorage.setItem(
      LS_PREFIX + key,
      JSON.stringify({ data, expires: Date.now() + ttlMs }),
    );
  } catch {
    /* quota / private mode */
  }
}

export const TTL = {
  home: 120_000,
  profile: 60_000,
  battles: 120_000,
  stats: 60_000,
  catalog: 24 * 60 * 60_000,
  topPlayers: 10 * 60_000,
  arenaDecks: 15 * 60_000,
  meta: 5 * 60_000,
} as const;

/** Persists outside ghosteek-cache:* so lsClearAll does not wipe it. */
const LINKED_TAG_STORAGE_KEY = "ghosteek-linked-player-tag";

function normalizeLinkedTag(tag: string | null | undefined): string {
  if (!tag) return "";
  return tag.trim().toUpperCase().replace(/^#/, "");
}

export function readStoredLinkedTag(): string {
  try {
    return localStorage.getItem(LINKED_TAG_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredLinkedTag(tag: string): void {
  try {
    if (!tag) localStorage.removeItem(LINKED_TAG_STORAGE_KEY);
    else localStorage.setItem(LINKED_TAG_STORAGE_KEY, tag);
  } catch {
    /* private mode */
  }
}

/**
 * Remember the linked CR tag. When it changes (bot /link or Settings unlink),
 * clear all Mini App caches so battles/stats/decks reload for the new account.
 * Returns true if caches were cleared.
 */
export function applyLinkedPlayerTag(tag: string | null | undefined): boolean {
  const next = normalizeLinkedTag(tag);
  const prev = readStoredLinkedTag();
  if (prev === next) return false;

  writeStoredLinkedTag(next);
  // First observation in this browser — just remember, don't wipe.
  if (!prev) return false;

  cacheInvalidate();
  lsClearAll();
  writeStoredLinkedTag(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("app:sync"));
  }
  return true;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { sleep };
