export type CardRole =
  | "win_condition"
  | "tank"
  | "mini_tank"
  | "splash"
  | "spell"
  | "small_spell"
  | "big_spell"
  | "building"
  | "air_defense"
  | "swarm"
  | "cycle"
  | "anti_tank"
  | "defensive"
  | "anti_swarm"
  | "counterpush"
  | "dps"
  | "support";

export type Archetype =
  | "Log Bait"
  | "Cycle"
  | "Beatdown"
  | "Control"
  | "Bridge Spam"
  | "Lava"
  | "Royal Giant"
  | "Graveyard"
  | "Siege"
  | "Fireball Bait"
  | "Split Lane"
  | "Meta";

export interface CardMeta {
  elixir: number;
  type: string;
  roles: CardRole[];
}

export interface DeckRecord {
  id: string;
  name: string;
  archetype: Archetype | string;
  avgElixir: number;
  cards: string[];
  source?: string;
  popularity?: number;
}

export interface CardsData {
  cards: Record<string, CardMeta>;
  version: number;
}

export interface DecksData {
  decks: DeckRecord[];
  synergyPairs: Record<string, number>;
  meta: { version: number; count: number; source: string };
}

export interface BuildResult {
  deck: string[];
  archetype: string;
  averageElixir: number;
  synergyScore: number;
  confidence: number;
  sourceDeckId?: string;
  sourceDeckName?: string;
}

export interface ScoredDeck {
  record: DeckRecord;
  score: number;
  confidence: number;
  overlap: number;
}
