import { useCallback, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Send } from "lucide-react";
import { Card, Button, PageHeader, ErrorState } from "@/components/ui";
import { api, ApiError } from "@/api/client";

type AiAction = { type: string; path: string };

type AiResponse = {
  intent: string;
  answer: string;
  sources: Record<string, unknown>;
  actions?: AiAction[];
};

/** Подписи как у страниц/вкладок приложения — без путей из кода. */
function actionLabel(path: string): string {
  const raw = path.split("?")[0] || path;
  if (raw === "/battles" || raw.startsWith("/battles/")) return "Бои";
  if (raw === "/analytics" || raw.startsWith("/analytics")) return "Аналитика";
  if (raw === "/decks/compare") return "Сравнение колод";
  if (raw === "/decks/mine/stats") return "Статистика колоды";
  if (raw.startsWith("/decks")) return "Колоды";
  if (raw === "/" || raw === "/profile") return "Профиль";
  if (raw.startsWith("/profile/search") || raw.startsWith("/search")) return "Поиск";
  if (raw.startsWith("/profile/cards")) return "Карты";
  if (raw.startsWith("/profile/mastery")) return "Мастерство";
  if (raw.startsWith("/settings")) return "Настройки";
  if (raw.startsWith("/ai")) return "Ghosteek AI";
  if (raw.startsWith("/player/")) return "Игрок";
  return "Открыть раздел";
}

const PRESETS = [
  { label: "Разбери колоду", message: "Разбери мою колоду" },
  { label: "А что заменить?", message: "А что заменить?" },
  { label: "Последний бой", message: "Разбери мой бой" },
  { label: "Что такое Tempo", message: "Что такое Tempo?" },
  { label: "Что такое Cycle", message: "Что такое Cycle?" },
  { label: "Апнуть кубки", message: "Как апнуть кубки?" },
] as const;

export function AiCoachPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResponse | null>(null);

  // Память сессии живёт на бэкенде (TTL). Не чистим при уходе со страницы —
  // иначе follow-up и summary сразу теряются.

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
        subtitle={<p className="page-subtitle">Только факты — без выдуманных цифр</p>}
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
          placeholder="Например: разбери мою колоду → потом «а что заменить?»"
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
                  <span className="text-sm text-cr-text truncate">{actionLabel(a.path)}</span>
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
