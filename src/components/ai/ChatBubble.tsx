import { memo } from "react";
import { Bot, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeckCard } from "@/components/ai/DeckCard";
import { MessageMarkdown } from "@/components/ai/MessageMarkdown";
import { ReplayAcceptedCard } from "@/components/ai/ReplayAcceptedCard";
import { ReplayAnalysisCard } from "@/components/ai/ReplayAnalysisCard";
import { TypingIndicator } from "@/components/ai/TypingIndicator";
import { actionLabel, type ChatMessage } from "@/components/ai/chatTypes";
import { Button } from "@/components/ui";
import { cn } from "@/utils";

type Props = {
  message: ChatMessage;
  onAnalyzeAnotherReplay?: () => void;
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

export const ChatBubble = memo(function ChatBubble({ message, onAnalyzeAnotherReplay }: Props) {
  const navigate = useNavigate();
  const isUser = message.role === "user";
  const isError = Boolean(message.error);
  const replayCard = message.replayCard;
  const hasAnalysis = Boolean(replayCard?.analysis);

  return (
    <div
      className={cn(
        "ai-row",
        isUser ? "ai-row--user" : "ai-row--bot",
        "ai-msg-enter",
      )}
    >
      {!isUser ? <AiIdentity detail={hasAnalysis ? "· Replay analysis" : undefined} /> : null}
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
        {!isUser && (message.deckCards?.length ?? 0) > 0
          ? message.deckCards!.map((deck, i) => (
              <DeckCard key={`${message.id}-deck-${i}`} deck={deck} />
            ))
          : !isUser && message.deckCard
            ? <DeckCard deck={message.deckCard} />
            : null}

        {!isUser && replayCard?.analysis ? (
          <ReplayAnalysisCard card={replayCard} onAnalyzeAnother={onAnalyzeAnotherReplay} />
        ) : !isUser && replayCard ? (
          <ReplayAcceptedCard card={replayCard} />
        ) : null}
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

export function ChatTypingRow({ detail = "· Анализирую…" }: { detail?: string }) {
  return (
    <div className="ai-row ai-row--bot ai-msg-enter">
      <AiIdentity detail={detail} />
      <div className="ai-bubble ai-bubble--bot glass-card ai-bubble--typing">
        <TypingIndicator />
      </div>
    </div>
  );
}
