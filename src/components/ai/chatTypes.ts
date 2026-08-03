/** Типы и локальное хранение истории Ghosteek AI-чата. */

export type ChatRole = "user" | "assistant";

export type ChatAction = {
  type: string;
  path: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  intent?: string | null;
  actions?: ChatAction[];
  createdAt: number;
  error?: boolean;
};

const LS_KEY = "ghosteek-ai-chat-v1";

/** In-memory cache — живёт при SPA-навигации без unmount потери. */
let memoryMessages: ChatMessage[] | null = null;

export function loadChatMessages(): ChatMessage[] {
  if (memoryMessages) return memoryMessages.map((m) => ({ ...m }));
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      memoryMessages = [];
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      memoryMessages = [];
      return [];
    }
    memoryMessages = parsed
      .filter((m): m is ChatMessage => {
        if (!m || typeof m !== "object") return false;
        const row = m as Record<string, unknown>;
        return (
          (row.role === "user" || row.role === "assistant") &&
          typeof row.content === "string" &&
          typeof row.id === "string"
        );
      })
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        intent: m.intent ?? null,
        actions: Array.isArray(m.actions) ? m.actions : undefined,
        createdAt: typeof m.createdAt === "number" ? m.createdAt : Date.now(),
        error: Boolean(m.error),
      }));
    return memoryMessages.map((m) => ({ ...m }));
  } catch {
    memoryMessages = [];
    return [];
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  memoryMessages = messages.map((m) => ({ ...m }));
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(memoryMessages));
  } catch {
    /* quota / private mode */
  }
}

export function clearChatMessages(): void {
  memoryMessages = [];
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

export function newMessageId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Подписи как у страниц/вкладок приложения — без путей из кода. */
export function actionLabel(path: string): string {
  const raw = path.split("?")[0] || path;
  if (raw === "/battles" || raw.startsWith("/battles/")) return "Бои";
  if (raw === "/analytics" || raw.startsWith("/analytics")) return "Аналитика";
  if (raw === "/decks/compare") return "Сравнение колод";
  if (raw === "/decks/mine/stats") return "Статистика колоды";
  if (raw.startsWith("/decks")) return "Колоды";
  if (raw === "/" || raw === "/profile") return "Профиль";
  if (raw.startsWith("/profile/search") || raw.startsWith("/search")) return "Поиск";
  if (raw.startsWith("/profile/cards")) return "Карты";
  if (raw.startsWith("/profile/mastery")) return "Мастерство";
  if (raw.startsWith("/settings")) return "Настройки";
  if (raw.startsWith("/ai")) return "Ghosteek AI";
  if (raw.startsWith("/player/")) return "Игрок";
  return "Открыть раздел";
}

export const CHAT_PRESETS = [
  { label: "Разбери колоду", message: "Разбери мою колоду" },
  { label: "А что заменить?", message: "А что заменить?" },
  { label: "Последний бой", message: "Разбери мой бой" },
  { label: "Что такое Tempo", message: "Что такое Tempo?" },
  { label: "Что такое Cycle", message: "Что такое Cycle?" },
  { label: "Апнуть кубки", message: "Как апнуть кубки?" },
] as const;
