import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Send, X } from "lucide-react";
import { Button, Loader } from "@/components/ui";
import { ChatBubble, ChatTypingRow } from "@/components/ai/ChatBubble";
import { CHAT_PRESETS } from "@/components/ai/chatTypes";
import { useGhosteekChat } from "@/hooks/useGhosteekChat";

export function AiCoachPage() {
  const navigate = useNavigate();
  const {
    messages,
    draft,
    setDraft,
    loading,
    booting,
    send,
    startNewConversation,
    hasMessages,
    pageContext,
    dismissPageContext,
  } = useGhosteekChat();

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, booting]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading || !draft.trim()) return;
    void send(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && draft.trim()) void send(draft);
    }
  };

  return (
    <div className="ai-chat">
      <header className="ai-chat-header">
        <div className="ai-chat-header-main">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="ai-icon-btn"
            aria-label="Назад на главную"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="ai-chat-title">Ghosteek AI</h1>
            <p className="ai-chat-subtitle">Тренер CR · коротко и по механике</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => void startNewConversation()}
          disabled={loading}
          className="!px-3 !py-2 !min-h-[2.5rem] text-sm gap-1.5 shrink-0"
        >
          <RotateCcw className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Начать новый разговор</span>
          <span className="sm:hidden">Новый</span>
        </Button>
      </header>

      {pageContext ? (
        <div className="ai-context-chip" role="status">
          <span className="ai-context-chip-text truncate">{pageContext.label}</span>
          <button
            type="button"
            className="ai-context-chip-dismiss"
            onClick={dismissPageContext}
            aria-label="Убрать контекст страницы"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      <div className="ai-chat-scroll">
        {booting ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : !hasMessages && !loading ? (
          <div className="ai-empty">
            <div className="ai-empty-mark" aria-hidden>
              G
            </div>
            <h2 className="ai-empty-title">Что разберём?</h2>
            <p className="ai-empty-text">
              {pageContext
                ? "Контекст уже подключён — напиши, что именно хочешь выжать из этого боя или колоды."
                : "Как с тренером: колода, бой, матчап, механика. Без воды — с практическим шагом."}
            </p>
            {!pageContext ? (
              <div className="ai-presets">
                {CHAT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={loading}
                    onClick={() => void send(p.message)}
                    className="ai-preset"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="ai-thread">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {loading && <ChatTypingRow />}
            <div ref={endRef} className="h-px shrink-0" />
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="ai-composer">
        {hasMessages && !pageContext && (
          <div className="ai-presets ai-presets--compact">
            {CHAT_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.label}
                type="button"
                disabled={loading}
                onClick={() => void send(p.message)}
                className="ai-preset"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="ai-composer-box">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              pageContext
                ? "Уточни вопрос — контекст уже передан…"
                : "Сообщение Ghosteek…"
            }
            rows={1}
            disabled={loading}
            className="ai-composer-input"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="ai-send-btn"
            aria-label="Отправить"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="ai-composer-hint">Enter — отправить · Shift+Enter — новая строка</p>
      </form>
    </div>
  );
}

export default AiCoachPage;
