import { useEffect, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, RotateCcw, Send, X } from "lucide-react";
import { Button, EmptyState, Loader, PageHeader } from "@/components/ui";
import { ChatBubble, ChatTypingRow } from "@/components/ai/ChatBubble";
import { CHAT_PRESETS } from "@/components/ai/chatTypes";
import { isReplayBusyStatus, REPLAY_MSG } from "@/components/ai/replay";
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
    beginReplaySelect,
    cancelReplaySelect,
    submitReplayFile,
    startNewConversation,
    hasMessages,
    pageContext,
    dismissPageContext,
    replayStatus,
  } = useGhosteekChat();

  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replayInputRef = useRef<HTMLInputElement>(null);
  const replayBusy = isReplayBusyStatus(replayStatus);
  const busy = loading || replayBusy;

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages, loading, booting, replayStatus]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    void send(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && draft.trim()) void send(draft);
    }
  };

  const onReplayButtonClick = () => {
    if (busy) return;
    beginReplaySelect();
    replayInputRef.current?.click();
  };

  const onReplayFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    void submitReplayFile(file);
  };

  useEffect(() => {
    const onFocus = () => cancelReplaySelect();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [cancelReplaySelect]);

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
          <div className="ai-context-slot">
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
          </div>
        ) : (
          <div className="ai-context-slot" aria-hidden />
        )}
      </div>

      <div className="ai-chat-body">
        <div className="ai-chat-scroll" ref={scrollRef}>
        {booting ? (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        ) : !hasMessages && !loading && !replayBusy ? (
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
                disabled={busy}
                onPick={(msg) => void send(msg)}
                className="ai-chip-row--empty"
              />
            ) : null}
          </div>
        ) : (
          <div className="ai-thread">
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                message={m}
                onAnalyzeAnotherReplay={busy ? undefined : onReplayButtonClick}
              />
            ))}
            {loading && <ChatTypingRow />}
            {replayBusy && (
              <ChatTypingRow
                detail={
                  replayStatus === "compressing"
                    ? REPLAY_MSG.compressing
                    : replayStatus === "validating"
                      ? REPLAY_MSG.analyzing
                      : REPLAY_MSG.checking
                }
              />
            )}
            <div ref={endRef} className="h-px shrink-0" />
          </div>
        )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="ai-composer">
        <input
          ref={replayInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={onReplayFileChange}
        />
        <div className="ai-composer-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onReplayButtonClick}
            className="ai-replay-btn"
          >
            Разобрать реплей
          </Button>
        </div>
        <div className="ai-composer-box glass-card !p-0">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={pageContext ? "Уточни вопрос…" : "Напиши вопрос…"}
            rows={1}
            disabled={busy}
            className="ai-composer-input"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={busy || !draft.trim()}
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
