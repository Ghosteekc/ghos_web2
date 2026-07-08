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

} from "@/types";

import { cacheGet, cacheSet, cacheInvalidate, TTL, sleep } from "./cache";



const API_BASE = import.meta.env.VITE_API_URL ?? "";



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

  if (API_BASE.includes("loca.lt")) {

    headers["Bypass-Tunnel-Reminder"] = "true";

  }

  return { ...headers, ...(extra as Record<string, string> | undefined) };

}



function isRetryable(status: number) {

  return status === 502 || status === 503 || status === 511 || status === 0;

}



async function requestOnce<T>(path: string, options?: RequestInit): Promise<T> {

  if (!API_BASE.trim()) {

    throw new ApiError(

      "Сервис временно недоступен. Попробуйте позже.",

      0,

    );

  }



  let res: Response;

  try {

    res = await fetch(`${API_BASE}${path}`, {

      ...options,

      headers: buildRequestHeaders(options?.headers),

    });

  } catch {

    throw new ApiError("Нет связи с сервером. Проверьте интернет и попробуйте позже.", 0);

  }



  const contentType = res.headers.get("content-type") ?? "";



  if (!res.ok) {

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

    throw new ApiError(body.detail ?? `Ошибка сервера (${res.status})`, res.status);

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

  const data = await request<T>(path);

  cacheSet(key, data, ttlMs);

  return data;

}



export const api = {

  getHome: () => cachedGet<HomeData>("home", "/api/home", TTL.home),



  getProfile: () => cachedGet<Profile>("profile-v4", "/api/me", TTL.profile),

  getPlayerCollection: () =>
    cachedGet<PlayerCollectionData>("player-collection-v9", "/api/profile/collection", TTL.profile),



  getBattles: () =>

    cachedGet<{ battles: BattleSummary[]; cached_total: number | null; cached_winrate: number | null }>(

      "battles",

      "/api/battles",

      TTL.battles,

    ),



  getBattle: (index: number) => request<BattleDetail>(`/api/battles/${index}`),



  getDecks: (type?: string) => {

    const key = `decks:${type ?? "all"}`;

    return cachedGet<DecksListData>(

      key,

      type ? `/api/decks?type=${type}` : "/api/decks",

      TTL.battles,

    );

  },



  getTopPlayers: () => request<TopPlayersData>("/api/decks/top-players?refresh=true"),



  getArenaDecks: () =>

    cachedGet<ArenaDecksData>("arena-decks", "/api/decks/arena", TTL.battles),



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

    cachedGet<{ cards: { name: string; name_ru: string; name_short?: string; icon: string; id?: number; elixir?: number }[] }>(

      "catalog",

      "/api/cards/catalog",

      TTL.stats,

    ),



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


