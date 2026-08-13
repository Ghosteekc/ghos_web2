import { memo } from "react";
import { Bot, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeckCard } from "@/components/ai/DeckCard";
import { MessageMarkdown } from "@/components/ai/MessageMarkdown";
import { TypingIndicator } from "@/components/ai/TypingIndicator";
import { actionLabel, type ChatMessage } from "@/components/ai/chatTypes";
import { Button } from "@/components/ui";
import { cn } from "@/utils";

type Props = {
  message: ChatMessage;
};

function AiIdentity({ detail }: { detail?: string }) {
  return (
    <div className="ai-identity">
      <span className="ai-identity-icon" aria-hidden>
        <Bot className="w-3.5 h-3.5" strokeWidth={2.25} />
      </span>
      <span className="ai-identity-label">Ghosteek AI</span>
      {detail ? <span className="ai-identity-detail">{detail}</span> : null}
    </div>
  );
}

export const ChatBubble = memo(function ChatBubble({ message }: Props) {
  const navigate = useNavigate();
  const isUser = message.role === "user";
  const isError = Boolean(message.error);

  return (
    <div
      className={cn(
        "ai-row",
        isUser ? "ai-row--user" : "ai-row--bot",
        "ai-msg-enter",
      )}
    >
      {!isUser ? <AiIdentity /> : null}
      <div
        className={cn(
          "ai-bubble",
          isUser ? "ai-bubble--user" : "ai-bubble--bot glass-card",
          isError && "ai-bubble--error",
        )}
      >
        {isUser ? (
          <p className="ai-bubble-plain whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MessageMarkdown
            content={message.content}
            className={cn("ai-md", isError && "ai-md--error")}
          />
        )}
        {!isUser && message.deckCard ? <DeckCard deck={message.deckCard} /> : null}
        {!isUser && message.actions && message.actions.length > 0 ? (
          <div className="ai-actions">
            {message.actions.map((a) => (
              <Button
                key={a.path}
                type="button"
                variant="secondary"
                onClick={() => navigate(a.path)}
                className="ai-action-btn"
              >
                <span className="truncate">{actionLabel(a.path)}</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-60" aria-hidden />
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
});

export function ChatTypingRow() {
  return (
    <div className="ai-row ai-row--bot ai-msg-enter">
      <AiIdentity detail="· Анализирую…" />
      <div className="ai-bubble ai-bubble--bot glass-card ai-bubble--typing">
        <TypingIndicator />
      </div>
    </div>
  );
}
