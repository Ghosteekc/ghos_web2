import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import { lsGet, lsSet, TTL } from "@/api/cache";

const CATALOG_LS_KEY = "card-catalog-v8";

/** Local season arts when official CDN lags (served from /public/cards). */
const LOCAL_CARD_ART: Record<
  string,
  { base?: string; evo?: string; hero?: string; forceEvo?: boolean; forceHero?: boolean }
> = {
  "elite barbarians": { evo: "/cards/elite-barbarians-ev1.png", forceEvo: true },
  valkyrie: { hero: "/cards/valkyrie-hero.png", forceHero: true },
  berserker: { hero: "/cards/berserker-hero.png", forceHero: true },
};

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

function applyLocalArt(card: CardCatalogItem): CardCatalogItem {
  const local = LOCAL_CARD_ART[normalize(card.name)];
  if (!local) return card;
  const next = { ...card };
  if (local.base) next.icon = local.base;
  if (local.evo) next.icon_evo = local.evo;
  if (local.hero) next.icon_hero = local.hero;
  if (local.forceEvo) {
    next.max_evolution_level = Math.max(next.max_evolution_level ?? 0, 1);
    if (!next.icon_evo) next.icon_evo = local.evo || next.icon;
  }
  if (local.forceHero) {
    next.has_hero = true;
    if (!next.icon_hero) next.icon_hero = local.hero || next.icon;
  }
  return next;
}

function mapFromCards(cards: CardCatalogItem[]): Map<string, CardCatalogItem> {
  const map = new Map<string, CardCatalogItem>();
  for (const card of cards) {
    const patched = applyLocalArt(card);
    map.set(normalize(patched.name), patched);
  }
  return map;
}

export function CardCatalogProvider({ children }: { children: ReactNode }) {
  const [byName, setByName] = useState<Map<string, CardCatalogItem>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cached = lsGet<{ cards: CardCatalogItem[] }>(CATALOG_LS_KEY, TTL.catalog);
    if (cached?.cards?.length) {
      setByName(mapFromCards(cached.cards));
      setReady(true);
    }

    void (async () => {
      try {
        const res = await api.getCardCatalog();
        const map = mapFromCards(res.cards);
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
