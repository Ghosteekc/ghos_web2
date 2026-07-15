import type { Archetype, CardRole } from "./types";

export const WEIGHT_CARD_MATCH = 25;
export const WEIGHT_ARCHETYPE = 20;
export const WEIGHT_ELIXIR = 15;
export const WEIGHT_SYNERGY = 15;
export const WEIGHT_POPULARITY = 5;

export const MATCH_CONFIDENCE_THRESHOLD = 80;
export const SYNERGY_MIN_THRESHOLD = 80;

export const DEFAULT_ELIXIR_MIN = 2.6;
export const DEFAULT_ELIXIR_MAX = 4.6;

export const ARCHETYPE_ELIXIR: Record<string, [number, number]> = {
  Cycle: [2.6, 3.4],
  "Log Bait": [2.8, 3.6],
  Beatdown: [3.8, 4.6],
  Lava: [3.5, 4.4],
  "Royal Giant": [3.4, 4.2],
  "Bridge Spam": [3.6, 4.4],
  Siege: [2.8, 3.6],
  Control: [3.0, 4.0],
  Graveyard: [3.2, 4.2],
  Meta: [2.8, 4.4],
};

export const FILL_PRIORITY: CardRole[] = [
  "win_condition",
  "big_spell",
  "small_spell",
  "air_defense",
  "mini_tank",
  "building",
  "dps",
  "cycle",
  "counterpush",
];

export const ARCHETYPE_ANCHORS: Record<Archetype, ReadonlySet<string>> = {
  "Log Bait": new Set(["Goblin Barrel", "Princess", "Goblin Gang"]),
  Cycle: new Set(["Hog Rider", "Ice Golem", "Skeletons", "Ice Spirit"]),
  Beatdown: new Set(["Golem", "Giant", "P.E.K.K.A", "Electro Giant"]),
  Lava: new Set(["Lava Hound", "Balloon"]),
  "Royal Giant": new Set(["Royal Giant", "Fisherman", "Hunter"]),
  "Bridge Spam": new Set(["P.E.K.K.A", "Battle Ram", "Bandit", "Royal Ghost"]),
  Siege: new Set(["X-Bow", "Mortar", "Tesla"]),
  Control: new Set(["Miner", "X-Bow", "Tesla"]),
  Graveyard: new Set(["Graveyard", "Freeze"]),
  "Fireball Bait": new Set(["Goblin Barrel", "Princess", "Fireball"]),
  "Split Lane": new Set(["Royal Hogs", "Wall Breakers", "Miner"]),
  Meta: new Set(),
};

export const WIN_CONDITIONS = new Set([
  "Hog Rider", "Balloon", "Golem", "Graveyard", "X-Bow", "Mortar", "Royal Giant",
  "Goblin Barrel", "Lava Hound", "Miner", "Giant", "P.E.K.K.A", "Battle Ram",
  "Wall Breakers", "Royal Hogs", "Goblin Giant", "Elixir Golem", "Electro Giant",
  "Skeleton Barrel", "Sparky", "Three Musketeers", "Elite Barbarians", "Goblin Drill",
]);

export const KNOWN_SYNERGY: Record<string, number> = {
  "Knight|Goblin Barrel": 96,
  "Princess|Goblin Barrel": 99,
  "Rocket|Inferno Tower": 88,
  "Hog Rider|Ice Golem": 94,
  "Lava Hound|Balloon": 97,
  "Golem|Night Witch": 95,
  "Miner|Poison": 92,
  "Royal Giant|Fisherman": 91,
  "Mega Knight|Inferno Dragon": 90,
  "Ice Spirit|Musketeer": 85,
};

export const SYNERGY_STRONG = 88;
export const SYNERGY_PARTIAL = 72;
export const SYNERGY_WEAK = 55;
