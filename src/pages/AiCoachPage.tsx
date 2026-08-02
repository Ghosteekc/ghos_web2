import { useCallback, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, ChevronRight, Send } from "lucide-react";
import { Card, Button, PageHeader, ErrorState } from "@/components/ui";
import { api, ApiError } from "@/api/client";

type AiAction = { type: string; path: string };

type AiResponse = {
  intent: string;
  answer: string;
  sources: Record<string, unknown>;
  actions?: AiAction[];
};

function serviceLabel(result: AiResponse): string {
  const s = result.sources?.service;
  return typeof s === "string" && s ? s : result.intent;
}

const PRESETS = [
  { label: "Собери колоду", message: "Собери колоду вокруг Хог Терпила Мушкетёр Пушка" },
  { label: "Разбери колоду", message: "Разбери мою колоду" },
  { label: "Последний бой", message: "Разбери мой бой" },
  { label: "Что такое cycle", message: "Что такое cycle?" },
  { label: "Апнуть кубки", message: "Как апнуть кубки?" },
] as const;

export function AiCoachPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResponse | null>(null);

  const ask = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.askGhosteekAi(trimmed);
      setResult(data);
      setMessage("");
    } catch (e) {
      setResult(null);
      setError(e instanceof ApiError ? e.message : "Не удалось получить ответ");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(message);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ghosteek AI"
        subtitle={
          <p className="page-subtitle">
            Ответы только из сервисов Ghosteek — без выдуманных цифр
          </p>
        }
        action={
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="!p-2 shrink-0"
            aria-label="Назад на главную"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={loading}
            onClick={() => void ask(p.message)}
            className="px-3 py-2 text-sm rounded-cr border border-cr-border info-glass text-cr-text hover:border-cr-gold/40 disabled:opacity-50 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Например: разбери мою колоду, матчап vs последней, что делает Палач…"
          rows={3}
          disabled={loading}
          className="w-full px-4 py-3 info-glass border border-cr-border rounded-cr text-cr-text placeholder:text-cr-muted focus:outline-none focus:border-cr-gold/50 focus:ring-2 focus:ring-cr-gold/20 transition-all resize-y min-h-[96px]"
        />
        <Button type="submit" disabled={loading || !message.trim()} className="w-full sm:w-auto gap-2">
          {loading ? (
            "Думаю…"
          ) : (
            <>
              <Send className="w-4 h-4" />
              Спросить
            </>
          )}
        </Button>
      </form>

      {error && <ErrorState title={error} />}

      {result && (
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-cr-muted">
            <Bot className="w-4 h-4 text-cr-gold shrink-0" />
            <span className="uppercase tracking-wide">
              {serviceLabel(result)} · {result.intent}
            </span>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-base text-cr-text leading-relaxed">
            {result.answer}
          </pre>
          {result.actions && result.actions.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-cr-border">
              {result.actions.map((a) => (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => navigate(a.path)}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-cr border border-cr-border hover:border-cr-gold/40 text-left transition-colors"
                >
                  <span className="text-sm text-cr-text truncate">{a.path}</span>
                  <ChevronRight className="w-4 h-4 text-cr-muted shrink-0" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default AiCoachPage;
