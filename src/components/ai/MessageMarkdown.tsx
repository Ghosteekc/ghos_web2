import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { useCardCatalog, type CardMention } from "@/hooks";
import { isInternalAppHref, preventNativeCallout } from "@/utils/nativeCallout";

type Props = {
  content: string;
  className?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const RU_ENDING = "(?:а|я|у|ю|ом|ем|ами|ями|ах|ях|е|ы|и|ой|ою|ею|ов)?";

function aliasToken(alias: string): string {
  const esc = escapeRegExp(alias);
  if (alias.length >= 5 && /^[а-яё]+$/i.test(alias)) {
    return `${esc}${RU_ENDING}`;
  }
  return esc;
}

/** Граница слова с учётом кириллицы (\b в JS не видит буквы вне ASCII). */
function wholeWordPattern(entries: CardMention[]): RegExp | null {
  if (!entries.length) return null;
  const alt = entries.map((e) => aliasToken(e.alias)).join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}_])(${alt})(?![\\p{L}\\p{N}_])`, "giu");
}

function labelForMatch(matched: string, entries: CardMention[]): string {
  const raw = matched.toLowerCase();
  const exact = entries.find((e) => e.alias.toLowerCase() === raw);
  if (exact) return exact.label;
  const stemmed = entries.find((e) => {
    const a = e.alias.toLowerCase();
    return raw.startsWith(a) && raw.length - a.length <= 4;
  });
  return stemmed?.label ?? matched;
}

function highlightCardNames(
  text: string,
  pattern: RegExp | null,
  entries: CardMention[],
): ReactNode[] {
  if (!text || !pattern) return [text];
  pattern.lastIndex = 0;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) != null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={`card-${key++}`} className="ai-card-mention">
        {labelForMatch(match[0], entries)}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : [text];
}

function walkHighlight(
  node: ReactNode,
  pattern: RegExp | null,
  entries: CardMention[],
): ReactNode {
  if (typeof node === "string") return <>{highlightCardNames(node, pattern, entries)}</>;
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <span key={i}>{walkHighlight(child, pattern, entries)}</span>
    ));
  }
  return node;
}

export function MessageMarkdown({ content, className }: Props) {
  const navigate = useNavigate();
  const { mentionEntries } = useCardCatalog();

  const pattern = useMemo(() => {
    if (!mentionEntries.length) return null;
    const lower = content.toLowerCase();
    const hit = mentionEntries.filter((e) => lower.includes(e.alias.toLowerCase()));
    return wholeWordPattern(hit);
  }, [content, mentionEntries]);

  return (
    <div className={className ?? "ai-md"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const url = href?.trim() ?? "";
            const body = walkHighlight(children, pattern, mentionEntries);

            // Внутренние пути приложения — без href, только navigate().
            if (isInternalAppHref(url)) {
              const path = url.startsWith("/")
                ? url
                : `/${url.replace(/^\.\//, "")}`;
              return (
                <button
                  type="button"
                  className="ai-md-link"
                  onClick={() => navigate(path)}
                  onContextMenu={preventNativeCallout}
                  draggable={false}
                >
                  {body}
                </button>
              );
            }

            // Якоря / пустые — не ссылки.
            if (!url || url.startsWith("#")) {
              return <span>{body}</span>;
            }

            // Настоящие внешние ссылки — оставляем <a>, callout не блокируем.
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ai-md-link"
              >
                {body}
              </a>
            );
          },
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
          p: ({ children }) => (
            <p className="ai-md-p">{walkHighlight(children, pattern, mentionEntries)}</p>
          ),
          li: ({ children }) => (
            <li className="ai-md-li">{walkHighlight(children, pattern, mentionEntries)}</li>
          ),
          strong: ({ children }) => (
            <strong className="ai-md-strong">{walkHighlight(children, pattern, mentionEntries)}</strong>
          ),
          em: ({ children }) => <em>{walkHighlight(children, pattern, mentionEntries)}</em>,
          ul: ({ children }) => <ul className="ai-md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="ai-md-ol">{children}</ol>,
          h1: ({ children }) => (
            <h3 className="ai-md-h">{walkHighlight(children, pattern, mentionEntries)}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="ai-md-h">{walkHighlight(children, pattern, mentionEntries)}</h3>
          ),
          h3: ({ children }) => (
            <h3 className="ai-md-h">{walkHighlight(children, pattern, mentionEntries)}</h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
