const store = new Map<string, { data: unknown; expires: number }>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
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

const LS_PREFIX = "ghosteek-cache:";

export function lsGet<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; expires: number };
    if (Date.now() > parsed.expires) {
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
  home: 45_000,
  profile: 60_000,
  battles: 60_000,
  stats: 60_000,
  catalog: 24 * 60 * 60_000,
} as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { sleep };
