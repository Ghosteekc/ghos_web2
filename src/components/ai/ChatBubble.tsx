import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeckCard } from "@/components/ai/DeckCard";
import { MessageMarkdown } from "@/components/ai/MessageMarkdown";
import { TypingIndicator } from "@/components/ai/TypingIndicator";
import { actionLabel, type ChatMessage } from "@/components/ai/chatTypes";

type Props = {
  message: ChatMessage;
};

export const ChatBubble = memo(function ChatBubble({ message }: Props) {
  const navigate = useNavigate();
  const isUser = message.role === "user";

  return (
    <div className={`ai-row ${isUser ? "ai-row--user" : "ai-row--bot"}`}>
      {!isUser && (
        <div className="ai-avatar" aria-hidden>
          G
        </div>
      )}
      <div
        className={[
          "ai-bubble",
          isUser ? "ai-bubble--user" : "ai-bubble--bot",
          message.error ? "ai-bubble--error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isUser ? (
          <p className="ai-bubble-plain whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MessageMarkdown content={message.content} />
        )}
        {!isUser && message.deckCard ? <DeckCard deck={message.deckCard} /> : null}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="ai-actions">
            {message.actions.map((a) => (
              <button
                key={a.path}
                type="button"
                onClick={() => navigate(a.path)}
                className="ai-action-btn"
              >
                <span className="truncate">{actionLabel(a.path)}</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export function ChatTypingRow() {
  return (
    <div className="ai-row ai-row--bot">
      <div className="ai-avatar" aria-hidden>
        G
      </div>
      <div className="ai-bubble ai-bubble--bot ai-bubble--typing">
        <TypingIndicator />
      </div>
    </div>
  );
}
