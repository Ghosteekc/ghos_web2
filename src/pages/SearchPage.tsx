import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  User,
  Trophy,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Card, Button, ErrorState, EmptyState, Loader, PageHeader } from "@/components/ui";
import { api, ApiError, isProRequiredError } from "@/api/client";
import { SearchResult } from "@/types";
import { usePageRefresh } from "@/hooks";
import { useGhosteekPro } from "@/hooks/useGhosteekPro";
import { ProGate } from "@/components/pro";

export function SearchPage() {
  const navigate = useNavigate();
  const { isPro, loading: proLoading } = useGhosteekPro();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPro) setLocked(false);
  }, [isPro]);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchPlayer(trimmed);
      setResults(res);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 8));
    } catch (e) {
      setResults([]);
      if (isProRequiredError(e)) {
        setLocked(true);
        setError(null);
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Не удалось найти игрока");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (query.trim().length >= 2) {
      await search(query);
    }
  }, [query, search]);

  usePageRefresh(refresh);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    const timeout = setTimeout(() => {
      void search(query);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const removeHistory = (item: string) => {
    setHistory((prev) => prev.filter((h) => h !== item));
  };

  const backButton = (
    <Button
      variant="ghost"
      onClick={() => navigate("/")}
      className="!p-2 shrink-0"
      aria-label="Назад к профилю"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );

  if (proLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (!isPro || locked) {
    return (
      <div className="space-y-4">
        <PageHeader title="Поиск игроков" action={backButton} />
        <ProGate feature="player_search" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Поиск игроков" action={backButton} />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cr-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="#TAG1234"
          className="w-full pl-12 pr-12 py-4 info-glass border border-cr-border rounded-cr text-cr-text placeholder:text-cr-muted focus:outline-none focus:border-cr-gold/50 focus:ring-2 focus:ring-cr-gold/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cr-muted"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {loading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader inline showLabel={false} />
          </div>
        )}
      </div>

      <p className="text-sm text-cr-muted -mt-2">
        Поиск работает только по тегу игрока — по нику найти нельзя.
      </p>

      {!loading && error && <ErrorState title={error} />}
      {!loading && !error && results.length > 0 && (
        <div className="space-y-3 ui-enter">
          <h3 className="text-base text-cr-muted">Результаты</h3>
          {results.map((result, i) => (
            <Card
              key={result.player_tag}
              delay={i * 0.04}
              className="cursor-pointer"
              onClick={() => navigate(`/player/${result.player_tag}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cr-surface flex items-center justify-center">
                    <User className="w-5 h-5 text-cr-muted" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-cr-text">{result.player_name}</p>
                    <p className="text-sm text-cr-muted font-mono">#{result.player_tag}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-cr-gold justify-end">
                      <Trophy className="w-4 h-4" />
                      <span className="text-base font-semibold">{result.trophies}</span>
                    </div>
                    <p className="text-sm text-cr-muted">{result.arena}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cr-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
        <EmptyState title="Игрок не найден" />
      )}

      {history.length > 0 && !loading && results.length === 0 && !query.trim() && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-cr-muted">История</h3>
            <Button variant="ghost" onClick={() => setHistory([])} className="!px-2 !py-1 text-sm">
              Очистить
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cr-card border border-cr-border text-sm text-cr-muted transition-colors cursor-pointer"
                onClick={() => setQuery(item)}
              >
                {item}
                <button onClick={() => removeHistory(item)} className="text-cr-muted">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { SearchPage as default };
