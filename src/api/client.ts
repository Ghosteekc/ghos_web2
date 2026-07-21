import {

  Profile,

  PlayerCollectionData,

  BattleSummary,

  BattleDetail,

  Deck,

  CardInfo,

  StatsOverview,

  SearchResult,

  Settings,

  HomeData,

  RandomDeck,

  TopPlayersData,

  DecksListData,

  ArenaDecksData,

  DeckCompareResult,
  MineDeckStats,
  InsightsData,
  WinrateEntry,
  OpponentEntry,
  CounterDeckData,
  CustomizeData,
  SynergyData,
  ConstructorData,
} from "@/types";

import { cacheGet, cacheSet, cacheInvalidate, cacheHas, inflight, TTL, sleep } from "./cache";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim();

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function usesDirectTunnel(): boolean {
  return API_BASE.includes("loca.lt");
}

function connectionHint(): string {
  if (usesDirectTunnel()) {
    return " Туннель до бота не отвечает — перезапустите start-tunnel.ps1 в отдельном окне PowerShell.";
  }
  return " Проверьте, что бот и start-tunnel.ps1 запущены.";
}

export class ApiError extends Error {

  status: number;

  constructor(message: string, status: number) {

    super(message);

    this.status = status;

  }

}



function getInitData(): string {

  return typeof window !== "undefined" ? window.Telegram?.WebApp?.initData ?? "" : "";

}



function buildRequestHeaders(extra?: HeadersInit): HeadersInit {

  const headers: Record<string, string> = {

    "X-Telegram-Init-Data": getInitData(),

    "Content-Type": "application/json",

  };

  if (usesDirectTunnel()) {

    headers["Bypass-Tunnel-Reminder"] = "true";

  }

  return { ...headers, ...(extra as Record<string, string> | undefined) };

}



function isTunnelBlockedResponse(res: Response, contentType: string): boolean {

  if (res.status === 511 || res.status === 403) return true;

  if (usesDirectTunnel() && !contentType.includes("application/json")) return true;

  return false;

}



function isRetryable(status: number) {

  return status === 502 || status === 503 || status === 511 || status === 0;

}



async function requestOnce<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;

  const controller = new AbortController();
  const timeoutMs = usesDirectTunnel() ? 35_000 : 25_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {

    res = await fetch(apiUrl(path), {

      ...options,

      signal: controller.signal,

      headers: buildRequestHeaders(options?.headers),

    });

  } catch (err) {

    const tunnelHint = connectionHint();
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      aborted
        ? `Сервер не ответил вовремя.${tunnelHint}`
        : `Нет связи с сервером.${tunnelHint}`,
      0,
    );

  } finally {

    clearTimeout(timer);

  }



  const contentType = res.headers.get("content-type") ?? "";



  if (!res.ok) {

    if (isTunnelBlockedResponse(res, contentType)) {

      throw new ApiError(

        "localtunnel заблокировал запрос (Forbidden). Откройте приложение через бота в Telegram, не по ссылке loca.lt.",

        res.status,

      );

    }

    if (res.status === 511) {

      throw new ApiError(

        "Сервер временно недоступен. Попробуйте позже.",

        res.status,

      );

    }

    if (res.status === 503 || res.status === 502) {

      throw new ApiError(

        "Сервер временно недоступен. Попробуйте позже.",

        res.status,

      );

    }

    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item?.msg ?? String(item)).join("; ")
          : `Ошибка сервера (${res.status})`;

    throw new ApiError(message, res.status);

  }



  if (!contentType.includes("application/json")) {

    throw new ApiError("Сервер вернул некорректный ответ. Попробуйте позже.", res.status);

  }



  return res.json();

}



async function request<T>(path: string, options?: RequestInit): Promise<T> {

  const retries = 2;

  let lastError: ApiError | null = null;



  for (let attempt = 0; attempt <= retries; attempt++) {

    try {

      return await requestOnce<T>(path, options);

    } catch (e) {

      lastError = e instanceof ApiError ? e : new ApiError(String(e), 0);

      if (isRetryable(lastError.status) && attempt < retries) {

        await sleep(600 * (attempt + 1));

        continue;

      }

      throw lastError;

    }

  }



  throw lastError ?? new ApiError("Неизвестная ошибка", 0);

}



async function cachedGet<T>(key: string, path: string, ttlMs: number): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit) return hit;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = request<T>(path)
    .then((data) => {
      cacheSet(key, data, ttlMs);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}



export const api = {

  getHome: () => cachedGet<HomeData>("home", "/api/home", TTL.home),



  getProfile: () => cachedGet<Profile>("profile-v4", "/api/me", TTL.profile),

  getPlayerCollection: () =>
    cachedGet<PlayerCollectionData>("player-collection-v12", "/api/profile/collection", TTL.profile),



  getBattles: () =>

    cachedGet<{ battles: BattleSummary[]; cached_total: number | null; cached_winrate: number | null }>(

      "battles",

      "/api/battles",

      TTL.battles,

    ),



  getBattle: (index: number) => request<BattleDetail>(`/api/battles/${index}`),

  getBattleByTime: (timestamp: string) =>
    request<BattleDetail>(`/api/battles/by-time/${encodeURIComponent(timestamp)}`),

  getWinrates: () => cachedGet<WinrateEntry[]>("winrates", "/api/winrates", TTL.stats),

  getOpponents: () => cachedGet<OpponentEntry[]>("opponents", "/api/opponents", TTL.battles),

  getCounterDeck: (index: number) =>
    request<CounterDeckData>(`/api/opponents/${index}/counter`),

  getCustomizeDeck: () => cachedGet<CustomizeData>("customize-v5", "/api/customize", TTL.battles),

  getSynergyDeck: () => cachedGet<SynergyData>("synergy-v2", "/api/synergy", TTL.battles),

  getPlayerPreview: (tag: string) => {
    const clean = tag.replace(/^#/, "");
    return cachedGet<SearchResult>(`player:${clean}`, `/api/players/${encodeURIComponent(clean)}`, TTL.profile);
  },

  removeFavoriteDeck: (deck: string[]) => {
    cacheInvalidate("favorites");
    return request<{ ok: true }>("/api/favorites", {
      method: "DELETE",
      body: JSON.stringify({ deck }),
    });
  },

  prefetchDeckTabs: () => {
    void cachedGet<DecksListData>("decks:meta", "/api/decks?type=meta", TTL.battles).catch(() => {});
    void cachedGet<TopPlayersData>("top-players-v2", "/api/decks/top-players?limit=10", TTL.topPlayers).catch(() => {});
    void cachedGet<ArenaDecksData>("arena-decks-v4", "/api/decks/arena", TTL.arenaDecks).catch(() => {});
  },

  getDecks: (type?: string) => {

    const key = `decks:${type ?? "all"}`;

    return cachedGet<DecksListData>(

      key,

      type ? `/api/decks?type=${type}` : "/api/decks",

      TTL.battles,

    );

  },



  getTopPlayers: () =>
    cachedGet<TopPlayersData>("top-players-v2", "/api/decks/top-players?limit=10", TTL.topPlayers),



  getArenaDecks: () =>
    cachedGet<ArenaDecksData>("arena-decks-v4", "/api/decks/arena", TTL.arenaDecks),



  compareDeck: (referenceCards: string[]) =>

    request<DeckCompareResult>("/api/decks/compare", {

      method: "POST",

      body: JSON.stringify({ reference_cards: referenceCards }),

    }),



  getMineDeckStats: (deckKey: string) =>

    cachedGet<MineDeckStats>(

      `mine-deck:${deckKey}`,

      `/api/decks/mine/stats?deck=${encodeURIComponent(deckKey)}`,

      TTL.battles,

    ),



  getCardCatalog: () =>

    cachedGet<{
      cards: {
        name: string;
        name_ru: string;
        name_short?: string;
        icon: string;
        id?: number;
        elixir?: number;
        max_evolution_level?: number;
        has_hero?: boolean;
        icon_evo?: string;
        icon_hero?: string;
      }[];
    }>(

      "catalog-v2",

      "/api/cards/catalog",

      TTL.stats,

    ),



  buildConstructorDecks: (slots: { name: string; slot: number }[]) =>

    request<ConstructorData>("/api/decks/constructor", {

      method: "POST",

      body: JSON.stringify({ slots }),

    }),



  getDeckCards: (cards: string[]) =>

    request<{ cards: CardInfo[] }>(`/api/cards?ids=${cards.join(",")}`),



  getStats: () => cachedGet<StatsOverview>("stats-v5", "/api/stats", TTL.stats),



  searchPlayer: (query: string) =>

    request<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`),



  getSettings: () => request<Settings>("/api/settings"),



  updateSettings: (settings: Partial<Settings>) =>

    request<Settings>("/api/settings", {

      method: "PUT",

      body: JSON.stringify(settings),

    }),



  clearCache: async () => {

    cacheInvalidate();

    return request<{ ok: boolean }>("/api/cache/clear", { method: "POST" });

  },



  syncData: async () => {

    cacheInvalidate();

    return request<{ ok: boolean; battles_loaded: number }>("/api/sync", { method: "POST" });

  },



  getRandomDeck: (rofl = false, excludeKey?: string) => {
    const params = new URLSearchParams();
    if (rofl) params.set("rofl", "true");
    if (excludeKey) params.set("exclude_key", excludeKey);
    params.set("_", String(Date.now()));
    const qs = params.toString();
    return request<RandomDeck>(`/api/decks/random${qs ? `?${qs}` : ""}`);
  },



  getInsights: () => cachedGet<InsightsData>("insights", "/api/insights", TTL.stats),



  getFavorites: () =>

    cachedGet<{ cards: CardInfo[]; decks: string[][]; entries?: { cards: string[]; deck_link?: string | null }[] }>(

      "favorites",

      "/api/favorites",

      TTL.battles,

    ),



  addFavoriteDeck: (deck: string[]) => {

    cacheInvalidate("favorites");

    return request<{ ok: true }>("/api/favorites", {

      method: "POST",

      body: JSON.stringify({ deck }),

    });

  },

};


