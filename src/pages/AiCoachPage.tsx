import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, RotateCcw, Send, X } from "lucide-react";
import { Button, EmptyState, Loader, PageHeader } from "@/components/ui";
import { ChatBubble, ChatTypingRow } from "@/components/ai/ChatBubble";
import { CHAT_PRESETS } from "@/components/ai/chatTypes";
import { useGhosteekChat } from "@/hooks/useGhosteekChat";
import { cn } from "@/utils";
import { internalPressableProps } from "@/utils/nativeCallout";

function PresetChips({
  presets,
  disabled,
  onPick,
  className,
}: {
  presets: readonly { label: string; message: string }[];
  disabled?: boolean;
  onPick: (message: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("ai-chip-row", className)}>
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p.message)}
          className="pixel-btn pixel-btn--chip-sm"
          {...internalPressableProps}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

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
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, loading, booting]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
      <div className="ai-chat-chrome-top">
        <PageHeader
          className="ai-chat-header"
          title="Ghosteek AI"
          titleClassName="pixel-bevel pixel-bevel--compact ai-chat-title"
          action={
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="!p-2 shrink-0"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          }
          trailing={
            <Button
              variant="secondary"
              onClick={() => void startNewConversation()}
              disabled={loading}
              className="!px-3 !py-2 !min-h-[2.5rem] text-sm gap-1.5 shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden />
              Новый
            </Button>
          }
        />

        {pageContext ? (
          <div className="ai-context-chip" role="status">
            <span className="ai-context-chip-text truncate">{pageContext.label}</span>
            <button
              type="button"
              className="ai-context-chip-dismiss"
              onClick={dismissPageContext}
              aria-label="Убрать контекст страницы"
              {...internalPressableProps}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="ai-chat-body">
        <div className="ai-chat-scroll">
        {booting ? (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        ) : !hasMessages && !loading ? (
          <div className="ai-empty">
            <EmptyState
              icon={Bot}
              title="Ghosteek AI"
              description={
                pageContext
                  ? "Тренер по Clash Royale. Контекст уже подключён — уточни вопрос."
                  : "Тренер по Clash Royale. Спроси про колоду, матчап, карту или механику."
              }
              className="ai-empty-card"
            />
            {!pageContext ? (
              <PresetChips
                presets={CHAT_PRESETS}
                disabled={loading}
                onPick={(msg) => void send(msg)}
                className="ai-chip-row--empty"
              />
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
      </div>

      <form onSubmit={onSubmit} className="ai-composer">
        <div className="ai-composer-box glass-card !p-0">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={pageContext ? "Уточни вопрос…" : "Напиши вопрос…"}
            rows={1}
            disabled={loading}
            className="ai-composer-input"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !draft.trim()}
            className="ai-send-btn"
            aria-label="Отправить"
          >
            <Send className="w-4 h-4" aria-hidden />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AiCoachPage;
