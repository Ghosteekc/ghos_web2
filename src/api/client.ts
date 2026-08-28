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
  MetaLadderData,
  MetaWarData,

  DeckCompareResult,
  MineDeckStats,
  ProInvoice,
  ProStatus,
  ProTrialResponse,
  ReferralStatus,
  RecommendDeckResponse,
  InsightsData,
  WinrateEntry,
  OpponentEntry,
  CounterDeckData,
  CustomizeData,
  SynergyData,
  ConstructorData,
} from "@/types";

import { cacheGet, cacheSet, cacheInvalidate, cacheHas, inflight, TTL, sleep, lsGet, lsSet, lsClearAll, applyLinkedPlayerTag } from "./cache";
import { setLastSyncAt } from "@/utils/lastSync";
import { toUserFacingError } from "@/utils/userError";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim();

const DEFAULT_UNAVAILABLE =
  "Нет соединения с ботом, попробуйте позже";

const PRO_STATUS_KEY = "pro-status-v1";
const META_CACHE_KEYS = ["meta-league-v2", "meta-trophies-v2", "meta-clan-wars-v1"] as const;

function invalidateMetaCache(): void {
  for (const key of META_CACHE_KEYS) {
    cacheInvalidate(key);
  }
}
const STATS_MEM_KEY = "stats-v8";
const STATS_LS_KEY = "stats-overview-v4";
const STATS_STALE_GRACE_MS = 7 * 24 * 60 * 60_000;

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function usesDirectTunnel(): boolean {
  return API_BASE.includes("loca.lt");
}

function requestTimeoutMs(path: string): number {
  const slow =
    path.startsWith("/api/stats") ||
    path.startsWith("/api/home") ||
    path.startsWith("/api/sync") ||
    path.startsWith("/api/battles");
  if (usesDirectTunnel()) return slow ? 55_000 : 35_000;
  return slow ? 45_000 : 25_000;
}

function formatApiError(message: string, code?: string): string {
  const friendly = toUserFacingError(
    { message: message || DEFAULT_UNAVAILABLE, code: code || "E100" },
    DEFAULT_UNAVAILABLE,
  );
  return `${friendly.message}\n\nКод ошибки: ${friendly.code}`;
}

function parseErrorBody(
  body: unknown,
  status: number,
): { message: string; code: string; feature?: string } {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.detail === "string"
          ? record.detail
          : DEFAULT_UNAVAILABLE;
    const code = typeof record.code === "string" ? record.code : `E1${Math.min(status, 999)}`;
    const feature = typeof record.feature === "string" ? record.feature : undefined;
    return { message, code, feature };
  }
  return { message: DEFAULT_UNAVAILABLE, code: `E1${Math.min(status, 999)}` };
}

function proErrorFromBody(body: unknown, status: number): ApiError | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const code = record.error_code ?? record.code;
  if (code !== PRO_REQUIRED) return null;
  const parsed = parseErrorBody(body, status);
  return new ApiError(parsed.message, status, PRO_REQUIRED, parsed.feature);
}

export class ApiError extends Error {
  status: number;
  code: string;
  /** Ghosteek Pro contract: which paid feature was requested. */
  feature?: string;

  constructor(message: string, status: number, code?: string, feature?: string) {
    super(message);
    this.status = status;
    this.code = code ?? (status > 0 ? `E1${Math.min(status, 999)}` : "E100");
    this.feature = feature;
  }
}

export const PRO_REQUIRED = "PRO_REQUIRED";

/** True when the backend refused the call because Ghosteek Pro is not active. */
export function isProRequiredError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.code === PRO_REQUIRED;
}



function getInitData(): string {

  return typeof window !== "undefined" ? window.Telegram?.WebApp?.initData ?? "" : "";

}



/** Telegram sometimes fills initData shortly after WebApp.ready — avoid racing the first fetch. */
async function waitForInitData(maxWaitMs = 3000): Promise<void> {
  if (getInitData()) return;
  if (typeof window === "undefined" || !window.Telegram?.WebApp) return;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(50);
    if (getInitData()) return;
  }
}



function isTransientErrorCode(code: string): boolean {
  return code === "E100" || code === "E101" || code === "E102" || code === "E103";
}



function isRetryableError(err: ApiError): boolean {
  if (isTransientErrorCode(err.code)) return true;
  return isRetryable(err.status);
}



function retryDelayMs(err: ApiError, attempt: number): number {
  if (isTransientErrorCode(err.code)) return 900 * (attempt + 1);
  return 600 * (attempt + 1);
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
  await waitForInitData();

  let res: Response;

  const controller = new AbortController();
  const timeoutMs = requestTimeoutMs(path);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {

    res = await fetch(apiUrl(path), {

      ...options,

      signal: controller.signal,

      headers: buildRequestHeaders(options?.headers),

    });

  } catch (err) {

    const aborted = err instanceof DOMException && err.name === "AbortError";
    const code = aborted ? "E101" : "E100";
    throw new ApiError(
      formatApiError(DEFAULT_UNAVAILABLE, code),
      0,
      code,
    );

  } finally {

    clearTimeout(timer);

  }



  const contentType = res.headers.get("content-type") ?? "";



  if (!res.ok) {

    // Ghosteek Pro gates answer 403, which the tunnel heuristic would otherwise swallow.
    if (res.status === 403 && contentType.includes("application/json")) {
      const body = await res.json().catch(() => ({}));
      const proError = proErrorFromBody(body, res.status);
      if (proError) throw proError;
      const parsed = parseErrorBody(body, res.status);
      throw new ApiError(formatApiError(parsed.message, parsed.code), res.status, parsed.code);
    }

    if (isTunnelBlockedResponse(res, contentType)) {
      throw new ApiError(
        formatApiError(DEFAULT_UNAVAILABLE, "E102"),
        res.status,
        "E102",
      );
    }

    if (res.status === 511 || res.status === 503 || res.status === 502) {
      throw new ApiError(
        formatApiError(DEFAULT_UNAVAILABLE, "E103"),
        res.status,
        "E103",
      );
    }

    const body = await res.json().catch(() => ({}));
    const parsed = parseErrorBody(body, res.status);
    throw new ApiError(
      formatApiError(parsed.message, parsed.code),
      res.status,
      parsed.code,
    );

  }



  if (!contentType.includes("application/json")) {

    throw new ApiError(formatApiError(DEFAULT_UNAVAILABLE, "E104"), res.status, "E104");

  }



  return res.json();

}



async function request<T>(path: string, options?: RequestInit): Promise<T> {

  const maxAttempts = 4;

  let lastError: ApiError | null = null;



  for (let attempt = 0; attempt < maxAttempts; attempt++) {

    try {

      return await requestOnce<T>(path, options);

    } catch (e) {

      lastError = e instanceof ApiError ? e : new ApiError(formatApiError(DEFAULT_UNAVAILABLE, "E099"), 0, "E099");

      if (isRetryableError(lastError) && attempt < maxAttempts - 1) {

        await sleep(retryDelayMs(lastError, attempt));

        continue;

      }

      throw lastError;

    }

  }



  throw lastError ?? new ApiError(formatApiError(DEFAULT_UNAVAILABLE, "E099"), 0, "E099");

}



async function cachedGetPersisted<T>(
  memKey: string,
  lsKey: string,
  path: string,
  ttlMs: number,
  staleGraceMs: number,
): Promise<T> {
  const hit = cacheGet<T>(memKey);
  if (hit) return hit;

  const pending = inflight.get(memKey);
  if (pending) return pending as Promise<T>;

  const promise = request<T>(path)
    .then((data) => {
      cacheSet(memKey, data, ttlMs);
      lsSet(lsKey, data, ttlMs);
      return data;
    })
    .catch((err) => {
      const stale = lsGet<T>(lsKey, ttlMs, staleGraceMs);
      if (stale) {
        cacheSet(memKey, stale, ttlMs);
        return stale;
      }
      throw err;
    })
    .finally(() => {
      inflight.delete(memKey);
    });

  inflight.set(memKey, promise);
  return promise;
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

export type ReplayAnalyzeSuccess = {
  ok: true;
  status: "validated" | "cr_replay" | "not_cr_replay" | "uncertain";
  filename: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number;
  width: number;
  height: number;
  fps: number | null;
  replay_detection?: {
    status: "cr_replay" | "not_cr_replay" | "uncertain";
    confidence: number;
    frames_analyzed: number;
    observations: string[];
  } | null;
  replay_facts?: {
    source: string;
    replay_status: string;
    confidence: number;
    duration_seconds: number;
    frames_analyzed: number;
    timeline: {
      timestamp_seconds: number;
      frame_index: number;
      observation_type: string;
      confidence: number;
      source: string;
    }[];
    facts: string[];
    limitations: string[];
    confirmed_cards?: {
      card_id: string;
      card_name: string;
      confidence: number;
      first_seen: number;
      last_seen: number;
    }[];
    ambiguous_cards?: {
      candidates: { card_id: string; card_name: string; confidence: number }[];
      frame_index: number;
      timestamp_seconds: number;
      location: string;
      source: string;
    }[];
    events?: {
      timestamp_seconds: number;
      event_type: string;
      player: string;
      card_id: string | null;
      confidence: number;
      source: string;
      evidence: {
        frame_indices: number[];
        observation_ids: string[];
        timestamps: number[];
      };
    }[];
    confirmed_events?: {
      timestamp_seconds: number;
      event_type: string;
      player: string;
      card_id: string | null;
      confidence: number;
      source: string;
      evidence: {
        frame_indices: number[];
        observation_ids: string[];
        timestamps: number[];
      };
    }[];
    candidate_events?: {
      timestamp_seconds: number;
      event_type: string;
      player: string;
      card_id: string | null;
      confidence: number;
      source: string;
      evidence?: {
        frame_indices: number[];
        observation_ids: string[];
        timestamps: number[];
      };
      evidence_frame_indexes?: number[];
      details?: Record<string, unknown>;
    }[];
    moment_shots?: {
      timestamp_seconds: number;
      label: string;
      kind: string;
      image_base64: string;
    }[];
    visual_moments?: {
      event_type: string;
      timestamp_seconds: number;
      card_name?: string | null;
      confidence: number;
      evidence_frame: {
        timestamp_seconds: number;
        frame_index: number;
        width?: number | null;
        height?: number | null;
      };
      evidence_id?: string | null;
      clip_id?: string | null;
      clip_available?: boolean;
      preview_base64?: string | null;
      source?: string;
      title?: string | null;
      short_description?: string | null;
      explanation_kind?: string | null;
      explanation_source?: string | null;
    }[];
    battle_timeline?: {
      duration_seconds: number;
      events: {
        timestamp_seconds: number;
        event_type: string;
        player: string;
        card_id: string | null;
        confidence: number;
        source: string;
        evidence: {
          frame_indices: number[];
          observation_ids: string[];
          timestamps: number[];
        };
      }[];
      confirmed_events: {
        timestamp_seconds: number;
        event_type: string;
        player: string;
        card_id: string | null;
        confidence: number;
        source: string;
        evidence: {
          frame_indices: number[];
          observation_ids: string[];
          timestamps: number[];
        };
      }[];
      unknown_intervals: { from: number; to: number; status: string }[];
      confidence: number;
      phases?: { phase: string; timestamp_seconds: number; confidence: number }[];
      summary?: {
        confirmed_event_count: number;
        confirmed_card_count: number;
        first_event: number | null;
        last_event: number | null;
        known_duration: number;
        unknown_intervals_count: number;
      };
    } | null;
    tactical_analysis?: {
      summary: string;
      positive_actions: string[];
      possible_mistakes: string[];
      matchup_observations: string[];
      deck_observations: string[];
      recommendations: string[];
      confidence: number;
      limitations: {
        what_we_know: string[];
        what_we_dont_know: string[];
      };
      conclusions?: {
        kind: string;
        text: string;
        confidence: number;
        evidence: string[];
        related_events: number[];
      }[];
    } | null;
    coach_reply?: string | null;
    coach_source?: string | null;
    grounded_summary?: string | null;
    grounded_limitations?: string | null;
    grounded_summary_source?: string | null;
    game_state_observations?: Record<string, unknown>[];
    elixir_observations?: {
      kind: string;
      timestamp: number;
      confidence: number;
      value: number | null;
      source?: string;
      evidence?: Record<string, unknown>;
    }[];
    cycle?: {
      player_cycle: string[];
      opponent_cycle: string[];
      confidence: number;
      limitations: string[];
    } | null;
    what_is_confirmed?: string[];
    what_is_uncertain?: string[];
    what_is_unavailable?: string[];
  } | null;
};

async function uploadReplayVideo(file: File): Promise<ReplayAnalyzeSuccess> {
  await waitForInitData();

  const form = new FormData();
  form.append("file", file, file.name);

  const headers: Record<string, string> = {
    "X-Telegram-Init-Data": getInitData(),
  };
  if (usesDirectTunnel()) {
    headers["Bypass-Tunnel-Reminder"] = "true";
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 300_000);

  let res: Response;
  try {
    res = await fetch(apiUrl("/api/ai/replay/analyze"), {
      method: "POST",
      body: form,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    const code = aborted ? "E101" : "E100";
    throw new ApiError(formatApiError(DEFAULT_UNAVAILABLE, code), 0, code);
  } finally {
    window.clearTimeout(timer);
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const errorCode = typeof body.error_code === "string" ? body.error_code : "";
  if (!res.ok || body.ok === false) {
    throw new ApiError(errorCode || DEFAULT_UNAVAILABLE, res.status, errorCode || `E1${Math.min(res.status, 999)}`);
  }

  return body as ReplayAnalyzeSuccess;
}

export const api = {

  getHome: () => cachedGet<HomeData>("home-v3", "/api/home", TTL.home),



  getProfile: async (opts?: { fresh?: boolean }) => {
    if (opts?.fresh) cacheInvalidate("profile-v8");
    const profile = await cachedGet<Profile>("profile-v8", "/api/me", TTL.profile);
    applyLinkedPlayerTag(profile.player_tag);
    return profile;
  },

  getPlayerCollection: () =>
    cachedGet<PlayerCollectionData>("player-collection-v13", "/api/profile/collection", TTL.profile),

  getProStatus: (opts?: { fresh?: boolean }) => {
    if (opts?.fresh) cacheInvalidate(PRO_STATUS_KEY);
    return cachedGet<ProStatus>(PRO_STATUS_KEY, "/api/pro/status", TTL.profile);
  },

  createProInvoice: (planId: string) =>
    request<ProInvoice>("/api/pro/invoice", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    }).then((invoice) => {
      cacheInvalidate(PRO_STATUS_KEY);
      cacheInvalidate("referral-v2");
      invalidateMetaCache();
      return invoice;
    }),

  startProTrial: () => {
    cacheInvalidate(PRO_STATUS_KEY);
    cacheInvalidate("profile-v8");
    invalidateMetaCache();
    return request<ProTrialResponse>("/api/pro/trial", { method: "POST" });
  },

  getReferralStatus: (opts?: { fresh?: boolean }) => {
    if (opts?.fresh) cacheInvalidate("referral-v2");
    return cachedGet<ReferralStatus>("referral-v2", "/api/referral", TTL.profile);
  },



  getBattles: () =>
    cachedGet<{ battles: BattleSummary[]; cached_total: number | null; cached_winrate: number | null }>(
      "battles-v5",
      "/api/battles",
      TTL.battles,
    ),

  getBattle: (index: number) =>
    cachedGet<BattleDetail>(`battle-v3:${index}`, `/api/battles/${index}`, TTL.battles),

  getBattleByTime: (timestamp: string) =>
    cachedGet<BattleDetail>(
      `battle-time-v3:${timestamp}`,
      `/api/battles/by-time/${encodeURIComponent(timestamp)}`,
      TTL.battles,
    ),

  getWinrates: () => cachedGet<WinrateEntry[]>("winrates-v4", "/api/winrates", TTL.stats),

  getOpponents: () => cachedGet<OpponentEntry[]>("opponents-v2", "/api/opponents", TTL.battles),

  getCounterDeck: (index: number) =>
    request<CounterDeckData>(`/api/opponents/${index}/counter`),

  getCustomizeDeck: () => cachedGet<CustomizeData>("customize-v7", "/api/customize", TTL.battles),

  getSynergyDeck: () => cachedGet<SynergyData>("synergy-v2", "/api/synergy", TTL.battles),

  getPlayerPreview: (tag: string) => {
    const clean = tag.replace(/^#/, "");
    return cachedGet<SearchResult>(`player-v6:${clean}`, `/api/players/${encodeURIComponent(clean)}`, TTL.profile);
  },

  removeFavoriteDeck: (deck: string[]) => {
    cacheInvalidate("favorites");
    return request<{ ok: true }>("/api/favorites", {
      method: "DELETE",
      body: JSON.stringify({ deck }),
    });
  },

  getDecks: (type?: string) => {
    const key = type === "mine" ? "decks:mine-v5" : `decks:${type ?? "all"}`;
    return cachedGet<DecksListData>(
      key,
      type ? `/api/decks?type=${type}` : "/api/decks",
      TTL.battles,
    );
  },



  getTopPlayers: () =>
    cachedGet<TopPlayersData>("top-players-v3", "/api/decks/top-players?limit=10", TTL.topPlayers),



  getArenaDecks: () =>
    cachedGet<ArenaDecksData>("arena-decks-v10", "/api/decks/arena", TTL.arenaDecks),

  getMetaLeague: () =>
    cachedGet<MetaLadderData>("meta-league-v2", "/api/meta/league", TTL.meta),

  getMetaTrophies: () =>
    cachedGet<MetaLadderData>("meta-trophies-v2", "/api/meta/trophies", TTL.meta),

  getMetaClanWars: () =>
    cachedGet<MetaWarData>("meta-clan-wars-v1", "/api/meta/clan-wars", TTL.meta),



  compareDeck: (referenceCards: string[], referenceLevels?: Array<number | null>) =>

    request<DeckCompareResult>("/api/decks/compare", {

      method: "POST",

      body: JSON.stringify({
        reference_cards: referenceCards,
        reference_levels: referenceLevels,
      }),

    }),



  getMineDeckStats: (deckKey: string) =>

    cachedGet<MineDeckStats>(

      `mine-deck:${deckKey}`,

      `/api/decks/mine/stats?deck=${encodeURIComponent(deckKey)}`,

      TTL.battles,

    ),



  recommendDeck: (
    cards: string[],
    applySwaps = false,
    opts?: { origin?: "player" | "builder"; builderScore?: number | null },
  ) =>
    request<RecommendDeckResponse>("/api/decks/recommend", {
      method: "POST",
      body: JSON.stringify({
        cards,
        apply_swaps: applySwaps,
        origin: opts?.origin ?? "player",
        builder_score: opts?.builderScore ?? null,
      }),
    }),



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
    }>("catalog-v4", "/api/cards/catalog", TTL.stats),



  buildConstructorDecks: (slots: { name: string; slot: number }[]) =>

    request<ConstructorData>("/api/decks/constructor", {

      method: "POST",

      body: JSON.stringify({ slots }),

    }),



  getDeckCards: (cards: string[]) =>

    request<{ cards: CardInfo[] }>(`/api/cards?ids=${cards.join(",")}`),



  getStats: () =>
    cachedGetPersisted<StatsOverview>(
      STATS_MEM_KEY,
      STATS_LS_KEY,
      "/api/stats",
      TTL.stats,
      STATS_STALE_GRACE_MS,
    ),



  searchPlayer: (query: string) =>

    request<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`),



  getSettings: (opts?: { fresh?: boolean }) => {
    if (opts?.fresh) cacheInvalidate("settings-v1");
    return cachedGet<Settings>("settings-v1", "/api/settings", TTL.profile);
  },



  updateSettings: async (settings: Partial<Settings>) => {
    const result = await request<Settings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    cacheSet("settings-v1", result, TTL.profile);
    return result;
  },



  clearCache: async () => {

    cacheInvalidate();

    return request<{ ok: boolean }>("/api/cache/clear", { method: "POST" });

  },



  clearBattleHistory: async () => {
    cacheInvalidate();
    return request<{ ok: boolean; deleted_count: number }>("/api/battles", { method: "DELETE" });
  },



  unlinkAccount: async () => {
    const result = await request<{ ok: boolean; unlinked_tag: string | null }>("/api/account/unlink", {
      method: "POST",
    });
    applyLinkedPlayerTag(null);
    cacheInvalidate();
    lsClearAll();
    return result;
  },



  syncData: async () => {
    cacheInvalidate();
    const result = await request<{ ok: boolean; battles_loaded: number }>("/api/sync", { method: "POST" });
    setLastSyncAt();
    return result;
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

  askGhosteekAi: (
    message: string,
    context?: {
      cards?: string[];
      opponent_cards?: string[];
      battle_index?: number;
      battle_time?: string;
      replay?: {
        status: string;
        filename?: string;
        duration_seconds?: number;
        width?: number;
        height?: number;
        confidence?: number | null;
      };
    },
  ) =>
    request<{
      intent: string;
      answer: string;
      sources: Record<string, unknown>;
      actions?: { type: string; path: string }[];
      deck_card?: {
        deck: string[];
        average_elixir: number;
        archetype: string;
        arena?: string | null;
        import_url?: string;
        gameplan?: string[];
        weaknesses?: string[];
        evaluation?: Record<string, unknown>;
        title?: string | null;
      } | null;
      battle_card?: Record<string, unknown> | null;
      analysis_card?: Record<string, unknown> | null;
    }>("/api/ai/ask", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    }),

  /** История ConversationManager (если бэкенд отдаёт GET /api/ai/session). */
  getGhosteekAiSession: () =>
    request<{
      ok: boolean;
      exists: boolean;
      messages: { role: string; content: string; intent?: string | null }[];
      session?: Record<string, unknown>;
    }>("/api/ai/session"),

  clearGhosteekAiSession: () =>
    request<{ ok: boolean; cleared: boolean }>("/api/ai/session", {
      method: "DELETE",
    }),

  analyzeReplay: (file: File) => uploadReplayVideo(file),

  /** Opaque evidence bytes (JPEG/WebP). Never accepts filesystem paths. */
  fetchReplayEvidence: async (evidenceId: string): Promise<Blob> => {
    const safeId = evidenceId.trim();
    if (!safeId || /[/\\]/.test(safeId) || safeId.includes("..") || safeId.length > 64) {
      throw new ApiError(formatApiError("Evidence not found", "E404"), 404, "E404");
    }
    await waitForInitData();
    const headers: Record<string, string> = {
      "X-Telegram-Init-Data": getInitData(),
    };
    if (usesDirectTunnel()) {
      headers["Bypass-Tunnel-Reminder"] = "true";
    }
    const res = await fetch(apiUrl(`/api/ai/replay/evidence/${encodeURIComponent(safeId)}`), {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new ApiError(formatApiError("Evidence not found", "E404"), res.status, "E404");
    }
    return res.blob();
  },
};


