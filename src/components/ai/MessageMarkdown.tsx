import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCardCatalog } from "@/hooks";

type Props = {
  content: string;
  className?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Граница слова с учётом кириллицы (\b в JS не видит буквы вне ASCII). */
function wholeWordPattern(names: string[]): RegExp | null {
  if (!names.length) return null;
  const alt = names.map(escapeRegExp).join("|");
  // (?<!letter) name (?!letter) — не матчить «Яд» внутри «СНАРЯДЫ»
  return new RegExp(`(?<![\\p{L}\\p{N}_])(${alt})(?![\\p{L}\\p{N}_])`, "giu");
}

function textHasCardMention(haystack: string, name: string): boolean {
  const re = wholeWordPattern([name]);
  if (!re) return false;
  re.lastIndex = 0;
  return re.test(haystack);
}

function highlightCardNames(text: string, pattern: RegExp | null): ReactNode[] {
  if (!text || !pattern) return [text];
  pattern.lastIndex = 0;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={`card-${key++}`} className="ai-card-mention">
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : [text];
}

function walkHighlight(node: ReactNode, pattern: RegExp | null): ReactNode {
  if (typeof node === "string") return <>{highlightCardNames(node, pattern)}</>;
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <span key={i}>{walkHighlight(child, pattern)}</span>
    ));
  }
  return node;
}

export function MessageMarkdown({ content, className }: Props) {
  const { mentionNames } = useCardCatalog();

  const pattern = useMemo(() => {
    if (!mentionNames.length) return null;
    // Только целые названия карт, не подстроки вроде «Яд» в «СНАРЯДЫ».
    const hit = mentionNames.filter((n) => textHasCardMention(content, n));
    return wholeWordPattern(hit);
  }, [content, mentionNames]);

  return (
    <div className={className ?? "ai-md"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-md-link"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            >
              {walkHighlight(children, pattern)}
            </a>
          ),
          code: ({ className: codeClass, children, ...props }) => {
            const inline = !codeClass;
            if (inline) {
              return (
                <code className="ai-md-code-inline" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={`ai-md-code-block ${codeClass || ""}`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="ai-md-pre">{children}</pre>,
          p: ({ children }) => <p className="ai-md-p">{walkHighlight(children, pattern)}</p>,
          li: ({ children }) => <li className="ai-md-li">{walkHighlight(children, pattern)}</li>,
          strong: ({ children }) => (
            <strong className="ai-md-strong">{walkHighlight(children, pattern)}</strong>
          ),
          em: ({ children }) => <em>{walkHighlight(children, pattern)}</em>,
          ul: ({ children }) => <ul className="ai-md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="ai-md-ol">{children}</ol>,
          h1: ({ children }) => <h3 className="ai-md-h">{walkHighlight(children, pattern)}</h3>,
          h2: ({ children }) => <h3 className="ai-md-h">{walkHighlight(children, pattern)}</h3>,
          h3: ({ children }) => <h3 className="ai-md-h">{walkHighlight(children, pattern)}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
