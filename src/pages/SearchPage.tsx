import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  User,
  Crown,
  Trophy,
  Star,
  Loader2,
} from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { api } from "@/api/client";
import { SearchResult } from "@/types";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.searchPlayer(q);
      setResults(res);
      setHistory((prev) => [q, ...prev.filter((h) => h !== q)].slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        void search(query);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const removeHistory = (item: string) => {
    setHistory((prev) => prev.filter((h) => h !== item));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-cr-text tracking-tight">Поиск игроков</h1>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cr-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите тег или никнейм..."
          className="w-full pl-12 pr-12 py-4 bg-cr-card border border-cr-border rounded-cr text-cr-text placeholder:text-cr-muted focus:outline-none focus:border-cr-gold/50 focus:ring-2 focus:ring-cr-gold/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cr-muted hover:text-cr-text"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {query && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-cr-gold" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm text-cr-muted">Результаты</h3>
            {results.map((result, i) => (
              <Card key={result.player_tag} delay={i * 0.05} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cr-surface flex items-center justify-center">
                      <User className="w-5 h-5 text-cr-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cr-text">{result.player_name}</p>
                      <p className="text-xs text-cr-muted font-mono">#{result.player_tag}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-cr-gold">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-semibold">{result.trophies}</span>
                    </div>
                    <p className="text-xs text-cr-muted">{result.arena}</p>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && !loading && results.length === 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-cr-muted">История</h3>
            <Button variant="ghost" onClick={() => setHistory([])} className="!px-2 !py-1 text-xs">
              Очистить
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cr-card border border-cr-border text-xs text-cr-muted hover:text-cr-text hover:border-cr-gold/30 transition-colors cursor-pointer"
                onClick={() => setQuery(item)}
              >
                {item}
                <button onClick={() => removeHistory(item)} className="hover:text-cr-loss">
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