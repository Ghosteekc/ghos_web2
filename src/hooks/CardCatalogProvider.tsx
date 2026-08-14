import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import { lsGet, lsSet, TTL } from "@/api/cache";

const CATALOG_LS_KEY = "card-catalog-v9";

/** Local season arts when official CDN lags (served from /public/cards). */
const LOCAL_CARD_ART: Record<
  string,
  { base?: string; evo?: string; hero?: string; forceEvo?: boolean; forceHero?: boolean }
> = {
  "elite barbarians": { evo: "/cards/elite-barbarians-ev1.png", forceEvo: true },
  // Valkyrie: long-standing evo + new hero — both must light up in split mode.
  valkyrie: { hero: "/cards/valkyrie-hero.png", forceHero: true, forceEvo: true },
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

export type CardMention = { alias: string; label: string };

interface CardCatalogContextValue {
  ready: boolean;
  getCard: (name: string) => CardCatalogItem | undefined;
  nameRu: (name: string) => string;
  nameShort: (name: string) => string;
  iconUrl: (name: string) => string | undefined;
  /** EN + RU имена для подсветки в тексте (длинные первыми). */
  mentionNames: string[];
  /** Алиасы (EN, slang, транслит) → подпись как в каталоге. */
  mentionEntries: CardMention[];
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
    const dualFloor = local.forceHero ? 3 : 1;
    next.max_evolution_level = Math.max(next.max_evolution_level ?? 0, dualFloor);
    // Only override evo art when we have a local asset — never collapse to base.
    if (local.evo) next.icon_evo = local.evo;
  }
  if (local.forceHero) {
    next.has_hero = true;
    if (local.hero) next.icon_hero = local.hero;
    else if (!next.icon_hero) next.icon_hero = next.icon;
  }
  return next;
}

const TRANSLIT_DIGRAPHS: [string, string][] = [
  ["knight", "найт"],
  ["balloon", "бэлоун"],
  ["light", "лайт"],
  ["stone", "стоун"],
  ["tomb", "тумб"],
  ["hound", "хаунд"],
  ["guard", "гвард"],
  ["witch", "вич"],
  ["spirit", "спирит"],
  ["mini", "мини"],
  ["mega", "мега"],
  ["tion", "шн"],
  ["ight", "айт"],
  ["ch", "ч"],
  ["sh", "ш"],
  ["th", "т"],
  ["ph", "ф"],
  ["oo", "у"],
  ["ee", "и"],
  ["qu", "кв"],
];

const TRANSLIT_LETTERS: Record<string, string> = {
  a: "а",
  b: "б",
  c: "к",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "дж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "к",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "кс",
  y: "и",
  z: "з",
};

/** Частый сленг / кривые написания, которых нет в каталоге. */
const EXTRA_ALIASES: Record<string, string[]> = {
  zap: ["зеп"],
  balloon: ["балун", "баллун"],
  lumberjack: ["лесоруб"],
  guards: ["гварды"],
  "mega knight": ["мегарыцарь", "megaknight"],
  "lava hound": ["lavahound", "лавхаунд"],
  tombstone: ["томбстоун"],
};

function gamerTranslit(en: string): string {
  let s = en.toLowerCase().replace(/['.]/g, "");
  for (const [from, to] of TRANSLIT_DIGRAPHS) {
    s = s.split(from).join(to);
  }
  let out = "";
  for (const ch of s) {
    if (ch === " " || ch === "-") continue;
    out += TRANSLIT_LETTERS[ch] ?? ch;
  }
  return out;
}

function aliasesForCard(card: CardCatalogItem): string[] {
  const aliases = new Set<string>();
  const add = (value?: string) => {
    const v = value?.trim();
    if (v) aliases.add(v);
  };
  add(card.name);
  add(card.name_ru);
  add(card.name_short);
  add(card.name.replace(/[\s.\-']/g, ""));
  const phonetic = gamerTranslit(card.name);
  add(phonetic);
  for (const extra of EXTRA_ALIASES[normalize(card.name)] ?? []) add(extra);
  return Array.from(aliases);
}

function buildMentionEntries(cards: Iterable<CardCatalogItem>): CardMention[] {
  const byAlias = new Map<string, string>();
  for (const card of cards) {
    const label = (card.name_ru || card.name).trim();
    if (!label) continue;
    for (const alias of aliasesForCard(card)) {
      byAlias.set(alias.toLowerCase(), label);
    }
  }
  return Array.from(byAlias.entries())
    .map(([alias, label]) => ({ alias, label }))
    .sort((a, b) => b.alias.length - a.alias.length);
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

  const mentionEntries = useMemo(() => buildMentionEntries(byName.values()), [byName]);

  const mentionNames = useMemo(
    () => mentionEntries.map((e) => e.alias),
    [mentionEntries],
  );

  const value = useMemo(
    () => ({ ready, getCard, nameRu, nameShort, iconUrl, mentionNames, mentionEntries }),
    [ready, getCard, nameRu, nameShort, iconUrl, mentionNames, mentionEntries],
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
      mentionEntries: [],
    };
  }
  return ctx;
}
