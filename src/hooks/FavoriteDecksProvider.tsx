import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/api/client";
import { cacheGet } from "@/api/cache";
import { buildFavoriteMap, normalizeDeckKey } from "@/utils/favorites";
import { usePageRefresh } from "./PageRefreshProvider";

interface FavoriteDecksContextValue {
  isFavorite: (cards: string[]) => boolean;
  toggleFavorite: (cards: string[]) => Promise<boolean>;
  removeFavorite: (cards: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoriteDecksContext = createContext<FavoriteDecksContextValue | null>(null);

export function FavoriteDecksProvider({ children }: { children: ReactNode }) {
  const [byKey, setByKey] = useState<Map<string, string[]>>(() => {
    const cached = cacheGet<{ decks?: string[][] }>("favorites");
    return buildFavoriteMap(cached?.decks ?? []);
  });

  const refresh = useCallback(async () => {
    try {
      const res = await api.getFavorites();
      const decks = res.decks ?? res.entries?.map((e) => e.cards) ?? [];
      setByKey(buildFavoriteMap(decks));
    } catch {
      /* сохраняем текущий список */
    }
  }, []);

  usePageRefresh(refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (cards: string[]) => cards.length === 8 && byKey.has(normalizeDeckKey(cards)),
    [byKey],
  );

  const removeFavorite = useCallback(async (cards: string[]) => {
    const stored = byKey.get(normalizeDeckKey(cards)) ?? cards;
    await api.removeFavoriteDeck(stored);
    setByKey((prev) => {
      const next = new Map(prev);
      next.delete(normalizeDeckKey(cards));
      return next;
    });
  }, [byKey]);

  const toggleFavorite = useCallback(
    async (cards: string[]) => {
      if (cards.length !== 8) return false;
      const key = normalizeDeckKey(cards);
      if (byKey.has(key)) {
        await removeFavorite(cards);
        return false;
      }
      await api.addFavoriteDeck(cards);
      setByKey((prev) => new Map(prev).set(key, cards));
      return true;
    },
    [byKey, removeFavorite],
  );

  const value = useMemo(
    () => ({ isFavorite, toggleFavorite, removeFavorite, refresh }),
    [isFavorite, toggleFavorite, removeFavorite, refresh],
  );

  return (
    <FavoriteDecksContext.Provider value={value}>{children}</FavoriteDecksContext.Provider>
  );
}

export function useFavoriteDecks(): FavoriteDecksContextValue {
  const ctx = useContext(FavoriteDecksContext);
  if (!ctx) {
    throw new Error("useFavoriteDecks must be used within FavoriteDecksProvider");
  }
  return ctx;
}
