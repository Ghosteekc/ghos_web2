import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import {
  type AiDeckCardData,
  type ChatMessage,
  clearChatMessages,
  loadChatMessages,
  newMessageId,
  saveChatMessages,
} from "@/components/ai/chatTypes";
import {
  type AiPageContext,
  clearAiPageContext,
  markAiPageContextAutoDone,
  peekAiPageContext,
  stashAiPageContext,
  toAskContext,
} from "@/utils/aiPageContext";

type BackendTurn = {
  role: string;
  content: string;
  intent?: string | null;
};

function mapBackendMessages(rows: BackendTurn[]): ChatMessage[] {
  const now = Date.now();
  return rows
    .filter((r) => (r.role === "user" || r.role === "assistant") && r.content?.trim())
    .map((r, i) => ({
      id: `be_${i}_${r.role}_${String(r.content).slice(0, 12)}`,
      role: r.role as "user" | "assistant",
      content: r.content,
      intent: r.intent ?? null,
      createdAt: now - (rows.length - i) * 1000,
    }));
}

function parseDeckCardFromApi(raw: unknown): AiDeckCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const deck = Array.isArray(row.deck)
    ? row.deck.filter((c): c is string => typeof c === "string")
    : [];
  if (deck.length < 8) return null;
  return {
    deck: deck.slice(0, 8),
    average_elixir: Number(row.average_elixir) || 0,
    archetype: typeof row.archetype === "string" ? row.archetype : "",
    arena: typeof row.arena === "string" ? row.arena : null,
    import_url: typeof row.import_url === "string" ? row.import_url : "",
    gameplan: Array.isArray(row.gameplan)
      ? row.gameplan.filter((x): x is string => typeof x === "string")
      : [],
    weaknesses: Array.isArray(row.weaknesses)
      ? row.weaknesses.filter((x): x is string => typeof x === "string")
      : [],
    evaluation:
      row.evaluation && typeof row.evaluation === "object"
        ? (row.evaluation as Record<string, unknown>)
        : {},
    title: typeof row.title === "string" ? row.title : null,
  };
}

function messagesFromAskSources(sources: Record<string, unknown> | undefined): ChatMessage[] | null {
  if (!sources || typeof sources !== "object") return null;
  const memory = sources.memory;
  if (memory && typeof memory === "object") {
    const recent = (memory as { recent_messages?: unknown }).recent_messages;
    if (Array.isArray(recent) && recent.length > 0) {
      return mapBackendMessages(recent as BackendTurn[]);
    }
  }
  const session = sources.session;
  if (session && typeof session === "object") {
    const recent = (session as { recent_messages?: unknown }).recent_messages;
    if (Array.isArray(recent) && recent.length > 0) {
      return mapBackendMessages(recent as BackendTurn[]);
    }
  }
  return null;
}

function readInitialPageContext(locationState: unknown): AiPageContext | null {
  const fromState =
    locationState &&
    typeof locationState === "object" &&
    "aiContext" in locationState
      ? (locationState as { aiContext?: AiPageContext }).aiContext
      : null;
  if (fromState?.source) {
    stashAiPageContext({ ...fromState, pendingAuto: fromState.pendingAuto !== false });
    return peekAiPageContext();
  }
  return peekAiPageContext();
}

export function useGhosteekChat() {
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatMessages());
  const [pageContext, setPageContext] = useState<AiPageContext | null>(() =>
    readInitialPageContext(location.state),
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(0);
  const autoSentRef = useRef(false);

  useEffect(() => {
    const next = readInitialPageContext(location.state);
    if (next) {
      if (next.pendingAuto) autoSentRef.current = false;
      setPageContext(next);
    }
  }, [location.state, location.key]);

  useEffect(() => {
    let cancelled = false;
    const local = loadChatMessages();
    setMessages(local);

    void (async () => {
      try {
        const remote = await api.getGhosteekAiSession();
        if (cancelled) return;
        const turns = remote?.messages;
        if (Array.isArray(turns) && turns.length > 0) {
          const mapped = mapBackendMessages(turns);
          setMessages(mapped);
          saveChatMessages(mapped);
        }
      } catch {
        /* keep local */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!booting) saveChatMessages(messages);
  }, [messages, booting]);

  const send = useCallback(
    async (text: string, opts?: { keepDraft?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const tick = ++abortRef.current;
      const userMsg: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!opts?.keepDraft) setDraft("");
      setLoading(true);
      setError(null);

      const askContext = toAskContext(peekAiPageContext() ?? pageContext);

      try {
        const data = await api.askGhosteekAi(trimmed, askContext);
        if (tick !== abortRef.current) return;

        const deckCard = parseDeckCardFromApi(data.deck_card);
        const fromSources = messagesFromAskSources(
          data.sources as Record<string, unknown> | undefined,
        );
        if (fromSources && fromSources.length > 0) {
          const merged = [...fromSources];
          for (let i = merged.length - 1; i >= 0; i -= 1) {
            if (merged[i].role === "assistant") {
              merged[i] = {
                ...merged[i],
                content: data.answer || merged[i].content,
                intent: data.intent ?? merged[i].intent,
                actions: data.actions ?? merged[i].actions,
                deckCard: deckCard ?? merged[i].deckCard,
              };
              break;
            }
          }
          setMessages(merged);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: data.answer,
          intent: data.intent,
          actions: data.actions,
          deckCard,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        if (tick !== abortRef.current) return;
        const msg = e instanceof ApiError ? e.message : "Не удалось получить ответ";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: newMessageId(),
            role: "assistant",
            content: msg,
            createdAt: Date.now(),
            error: true,
          },
        ]);
      } finally {
        if (tick === abortRef.current) setLoading(false);
      }
    },
    [pageContext],
  );

  // Авто-старт: контекст страницы → сразу вопрос с GhosteekAiContext.
  useEffect(() => {
    if (booting || loading || autoSentRef.current) return;
    const ctx = peekAiPageContext() ?? pageContext;
    if (!ctx?.pendingAuto || !ctx.autoPrompt.trim()) return;
    autoSentRef.current = true;
    const next = markAiPageContextAutoDone(ctx);
    setPageContext(next);
    void send(ctx.autoPrompt);
  }, [booting, loading, pageContext, send]);

  const dismissPageContext = useCallback(() => {
    clearAiPageContext();
    setPageContext(null);
  }, []);

  const startNewConversation = useCallback(async () => {
    abortRef.current += 1;
    autoSentRef.current = false;
    setLoading(true);
    setError(null);
    try {
      await api.clearGhosteekAiSession();
    } catch {
      /* UI clear anyway */
    } finally {
      clearChatMessages();
      clearAiPageContext();
      setPageContext(null);
      setMessages([]);
      setDraft("");
      setLoading(false);
    }
  }, []);

  return {
    messages,
    draft,
    setDraft,
    loading,
    booting,
    error,
    send,
    startNewConversation,
    hasMessages: messages.length > 0,
    pageContext,
    dismissPageContext,
  };
}
