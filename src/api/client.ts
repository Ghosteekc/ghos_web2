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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const initData = getInitData();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "X-Telegram-Init-Data": initData,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail ?? `HTTP ${res.status}`, res.status);
  }
  return res.json();
}

export const api = {
  getProfile: () => request<Profile>("/api/me"),
  getBattles: () => request<{ battles: BattleSummary[]; cached_total: number | null; cached_winrate: number | null }>("/api/battles"),
  getBattle: (index: number) => request<BattleDetail>(`/api/battles/${index}`),
  getDecks: (type?: string) =>
    request<{ decks: Deck[] }>(type ? `/api/decks?type=${type}` : "/api/decks"),
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
  getFavorites: () => request<{ cards: CardInfo[]; decks: string[][] }>("/api/favorites"),
  addFavoriteDeck: (deck: string[]) => request<{ ok: true }>("/api/favorites", {
    method: "POST",
    body: JSON.stringify({ deck }),
  }),
};