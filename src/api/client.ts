import {
  Profile,
  BattleSummary,
  BattleDetail,
  Deck,
  CardInfo,
  StatsOverview,
  SearchResult,
  Settings,
} from "@/types";

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
  // localtunnel (loca.lt) returns 511 without this header
  if (API_BASE.includes("loca.lt")) {
    headers["Bypass-Tunnel-Reminder"] = "true";
  }
  return { ...headers, ...(extra as Record<string, string> | undefined) };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE.trim()) {
    throw new ApiError(
      "VITE_API_URL не задан. На Vercel укажите URL localtunnel (https://....loca.lt) и пересоберите проект.",
      0,
    );
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildRequestHeaders(options?.headers),
  });

  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    if (res.status === 511) {
      throw new ApiError(
        "localtunnel требует авторизацию. Откройте URL туннеля в браузере один раз, затем обновите Mini App.",
        res.status,
      );
    }
    if (res.status === 503 || res.status === 502) {
      throw new ApiError(
        "Backend недоступен (туннель offline). Перезапустите: npx localtunnel --port 8080 и обновите VITE_API_URL на Vercel.",
        res.status,
      );
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail ?? `HTTP ${res.status}`, res.status);
  }

  if (!contentType.includes("application/json")) {
    throw new ApiError(
      "Ответ не JSON — проверьте VITE_API_URL (должен быть URL backend-туннеля, не Vercel).",
      res.status,
    );
  }

  return res.json();
}

export const api = {
  getProfile: () => request<Profile>("/api/me"),
  getBattles: () => request<{ battles: BattleSummary[]; cached_total: number | null; cached_winrate: number | null }>("/api/battles"),
  getBattle: (index: number) => request<BattleDetail>(`/api/battles/${index}`),
  getDecks: (type?: string) =>
    request<{ decks: Deck[] }>(type ? `/api/decks?type=${type}` : "/api/decks"),
  getCardCatalog: () =>
    request<{ cards: { name: string; name_ru: string; icon: string; id?: number; elixir?: number }[] }>(
      "/api/cards/catalog",
    ),
  getDeckCards: (cards: string[]) =>
    request<{ cards: CardInfo[] }>(`/api/cards?ids=${cards.join(",")}`),
  getStats: () => request<StatsOverview>("/api/stats"),
  searchPlayer: (query: string) =>
    request<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`),
  getSettings: () => request<Settings>("/api/settings"),
  updateSettings: (settings: Partial<Settings>) =>
    request<Settings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
  clearCache: () =>
    request<{ ok: boolean }>("/api/cache/clear", {
      method: "POST",
    }),
  getFavorites: () => request<{ cards: CardInfo[]; decks: string[][]; entries?: { cards: string[]; deck_link?: string | null }[] }>("/api/favorites"),
  addFavoriteDeck: (deck: string[]) => request<{ ok: true }>("/api/favorites", {
    method: "POST",
    body: JSON.stringify({ deck }),
  }),
};
