import type { CardRole } from "./types";

export const MAX_SPELLS = 3;
export const MAX_WINS = 1;

/** Карты, дающие ложное совпадение с любым шаблоном */
export const GENERIC_CARDS = new Set([
  "The Log", "Zap", "Arrows", "Fireball", "Knight", "Skeletons", "Ice Spirit",
  "Electro Spirit", "Fire Spirit", "Heal Spirit", "Bats", "Goblins", "Spear Goblins",
  "Cannon", "Tesla", "Musketeer", "Ice Golem", "Giant Snowball", "Barbarian Barrel",
]);

export const WIN_CONDITIONS = new Set([
  "Hog Rider", "Balloon", "Golem", "Graveyard", "X-Bow", "Mortar", "Royal Giant",
  "Goblin Barrel", "Lava Hound", "Miner", "Giant", "P.E.K.K.A", "Battle Ram",
  "Wall Breakers", "Royal Hogs", "Goblin Giant", "Elixir Golem", "Electro Giant",
  "Skeleton Barrel", "Sparky", "Three Musketeers", "Elite Barbarians", "Goblin Drill",
  "Royal Ghost", "Bandit", "Ram Rider", "Mighty Miner", "Skeleton King",
  "Goblin Machine", "Boss Bandit", "Rune Giant",
]);

/** Главная угроза архетипа — без неё шаблон нельзя брать */
export const ARCHETYPE_PRIMARY_WIN: Record<string, string[]> = {
  Cycle: ["Hog Rider", "Mortar", "Miner"],
  "Log Bait": ["Goblin Barrel"],
  Beatdown: ["Golem", "Giant", "Electro Giant", "P.E.K.K.A"],
  Lava: ["Lava Hound", "Balloon"],
  "Royal Giant": ["Royal Giant"],
  "Bridge Spam": ["P.E.K.K.A", "Battle Ram", "Royal Ghost", "Bandit"],
  Siege: ["X-Bow", "Mortar"],
  Control: ["Miner", "X-Bow", "Graveyard"],
  Graveyard: ["Graveyard"],
  Meta: [],
};

export const WEIGHT_CARD_MATCH = 25;
export const WEIGHT_ARCHETYPE = 20;
export const WEIGHT_ELIXIR = 15;
export const WEIGHT_SYNERGY = 15;
export const WEIGHT_POPULARITY = 5;

export const MATCH_CONFIDENCE_THRESHOLD = 80;
export const SYNERGY_MIN_THRESHOLD = 70;

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

export const ARCHETYPE_ANCHORS: Record<string, ReadonlySet<string>> = {
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
  "Royal Ghost|Bandit": 90,
  "P.E.K.K.A|Battle Ram": 92,
};

export const SYNERGY_STRONG = 88;
export const SYNERGY_PARTIAL = 72;
export const SYNERGY_WEAK = 55;
