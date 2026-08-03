import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import { lsGet, lsSet, TTL } from "@/api/cache";

const CATALOG_LS_KEY = "card-catalog-v6";

export interface CardCatalogItem {
  name: string;
  name_ru: string;
  name_short?: string;
  icon: string;
  id?: number | null;
  elixir?: number | null;
  max_evolution_level?: number;
  has_hero?: boolean;
  icon_evo?: string;
  icon_hero?: string;
}

interface CardCatalogContextValue {
  ready: boolean;
  getCard: (name: string) => CardCatalogItem | undefined;
  nameRu: (name: string) => string;
  nameShort: (name: string) => string;
  iconUrl: (name: string) => string | undefined;
  /** EN + RU имена для подсветки в тексте (длинные первыми). */
  mentionNames: string[];
}

const CardCatalogContext = createContext<CardCatalogContextValue | null>(null);

function normalize(name: string) {
  return name.trim().toLowerCase();
}

export function CardCatalogProvider({ children }: { children: ReactNode }) {
  const [byName, setByName] = useState<Map<string, CardCatalogItem>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cached = lsGet<{ cards: CardCatalogItem[] }>(CATALOG_LS_KEY, TTL.catalog);
    if (cached?.cards?.length) {
      const map = new Map<string, CardCatalogItem>();
      for (const card of cached.cards) {
        map.set(normalize(card.name), card);
      }
      setByName(map);
      setReady(true);
    }

    void (async () => {
      try {
        const res = await api.getCardCatalog();
        const map = new Map<string, CardCatalogItem>();
        for (const card of res.cards) {
          map.set(normalize(card.name), card);
        }
        if (!cancelled) {
          setByName(map);
          lsSet(CATALOG_LS_KEY, res, TTL.catalog);
        }
      } catch {
        /* catalog optional */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getCard = useCallback(
    (name: string) => byName.get(normalize(name)),
    [byName],
  );

  const nameRu = useCallback(
    (name: string) => getCard(name)?.name_ru ?? name,
    [getCard],
  );

  const nameShort = useCallback(
    (name: string) => getCard(name)?.name_short || getCard(name)?.name_ru || name,
    [getCard],
  );

  const iconUrl = useCallback(
    (name: string) => getCard(name)?.icon || undefined,
    [getCard],
  );

  const mentionNames = useMemo(() => {
    const names = new Set<string>();
    for (const card of byName.values()) {
      if (card.name?.trim()) names.add(card.name.trim());
      if (card.name_ru?.trim()) names.add(card.name_ru.trim());
    }
    return Array.from(names).sort((a, b) => b.length - a.length);
  }, [byName]);

  const value = useMemo(
    () => ({ ready, getCard, nameRu, nameShort, iconUrl, mentionNames }),
    [ready, getCard, nameRu, nameShort, iconUrl, mentionNames],
  );

  return <CardCatalogContext.Provider value={value}>{children}</CardCatalogContext.Provider>;
}

export function useCardCatalog(): CardCatalogContextValue {
  const ctx = useContext(CardCatalogContext);
  if (!ctx) {
    return {
      ready: true,
      getCard: () => undefined,
      nameRu: (name: string) => name,
      nameShort: (name: string) => name,
      iconUrl: () => undefined,
      mentionNames: [],
    };
  }
  return ctx;
}
