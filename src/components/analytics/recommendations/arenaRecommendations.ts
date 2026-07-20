export interface ArenaRecommendationConfig {
  arena: number;
  name: string;
  minTrophies: number;
  priorityCards: string[];
}

/** Trophy Road arenas in unlock order + Legend League (arena 24). */
export const ARENA_RECOMMENDATIONS: ArenaRecommendationConfig[] = [
  {
    arena: 1,
    name: "Гоблинов стадион",
    minTrophies: 0,
    priorityCards: ["Knight", "Archers", "Goblins", "Fireball", "Giant", "Musketeer", "Mini P.E.K.K.A", "Zap"],
  },
  {
    arena: 2,
    name: "Костяная яма",
    minTrophies: 500,
    priorityCards: ["Knight", "Archers", "Goblins", "Fireball", "Giant", "Musketeer", "Mini P.E.K.K.A", "Cannon"],
  },
  {
    arena: 3,
    name: "Варварская арена",
    minTrophies: 1000,
    priorityCards: ["Knight", "Archers", "Goblins", "Fireball", "Giant", "Valkyrie", "Musketeer", "Zap"],
  },
  {
    arena: 4,
    name: "Долина заклинаний",
    minTrophies: 1300,
    priorityCards: ["Knight", "Archers", "Fireball", "Giant", "Valkyrie", "Wizard", "Musketeer", "Zap"],
  },
  {
    arena: 5,
    name: "Мастерская строителя",
    minTrophies: 1600,
    priorityCards: ["Knight", "Archers", "Fireball", "Giant", "Valkyrie", "Wizard", "Hog Rider", "Zap"],
  },
  {
    arena: 6,
    name: "Игровая P.E.K.K.A",
    minTrophies: 2000,
    priorityCards: ["Knight", "Archers", "Fireball", "Giant", "Valkyrie", "Wizard", "Hog Rider", "Mini P.E.K.K.A"],
  },
  {
    arena: 7,
    name: "Королевская арена",
    minTrophies: 2300,
    priorityCards: ["Knight", "Archers", "Fireball", "Giant", "Valkyrie", "Wizard", "Hog Rider", "Musketeer"],
  },
  {
    arena: 8,
    name: "Ледяной пик",
    minTrophies: 2600,
    priorityCards: ["Knight", "Archers", "Fireball", "Giant", "Valkyrie", "Wizard", "Hog Rider", "Ice Spirit"],
  },
  {
    arena: 9,
    name: "Арена джунглей",
    minTrophies: 3000,
    priorityCards: ["Knight", "Archers", "Fireball", "Hog Rider", "Valkyrie", "Wizard", "Mega Minion", "Zap"],
  },
  {
    arena: 10,
    name: "Гора хogs",
    minTrophies: 3300,
    priorityCards: ["Knight", "Archers", "Fireball", "Hog Rider", "Valkyrie", "Wizard", "Mega Minion", "The Log"],
  },
  {
    arena: 11,
    name: "Электро-долина",
    minTrophies: 3600,
    priorityCards: ["Knight", "Archers", "Fireball", "Hog Rider", "Wizard", "Mega Minion", "Zap", "The Log"],
  },
  {
    arena: 12,
    name: "Жуткий город",
    minTrophies: 4000,
    priorityCards: ["Knight", "Skeletons", "Fireball", "Hog Rider", "Wizard", "Mega Minion", "Tesla", "The Log"],
  },
  {
    arena: 13,
    name: "Логово хулиганов",
    minTrophies: 4300,
    priorityCards: ["Knight", "Skeletons", "Fireball", "Hog Rider", "Wizard", "Tesla", "Mega Minion", "The Log"],
  },
  {
    arena: 14,
    name: "Безмятежный пик",
    minTrophies: 4600,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Archers", "The Log"],
  },
  {
    arena: 15,
    name: "Шахта шахтёра",
    minTrophies: 5000,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Hog Rider", "The Log"],
  },
  {
    arena: 16,
    name: "Безмолвное святилище",
    minTrophies: 5300,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Inferno Tower", "The Log"],
  },
  {
    arena: 17,
    name: "Кухня палача",
    minTrophies: 5600,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Prince", "The Log"],
  },
  {
    arena: 18,
    name: "Королевская гробница",
    minTrophies: 6000,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Balloon", "The Log"],
  },
  {
    arena: 19,
    name: "Кладбище",
    minTrophies: 6300,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Graveyard", "The Log"],
  },
  {
    arena: 20,
    name: "Тёмная башня",
    minTrophies: 6600,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Lava Hound", "The Log"],
  },
  {
    arena: 21,
    name: "Запретная арена",
    minTrophies: 7000,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Electro Wizard", "The Log"],
  },
  {
    arena: 22,
    name: "Трофейная дорога",
    minTrophies: 7300,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Royal Ghost", "The Log"],
  },
  {
    arena: 23,
    name: "Арена 23+",
    minTrophies: 7600,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Phoenix", "The Log"],
  },
  {
    arena: 24,
    name: "Лига легенд",
    minTrophies: 9000,
    priorityCards: ["Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Archer Queen", "The Log"],
  },
];

/** English API arena names → our arena number (partial match). */
const ARENA_NAME_ALIASES: Record<string, number> = {
  "goblin stadium": 1,
  "goblin": 1,
  "bone pit": 2,
  "barbarian bowl": 3,
  "barbarian": 3,
  "spell valley": 4,
  "builder": 5,
  "p.e.k.k.a": 6,
  "pekkas playhouse": 6,
  "royal arena": 7,
  "frozen peak": 8,
  "jungle arena": 9,
  "hog mountain": 10,
  "electro valley": 11,
  "spooky town": 12,
  "rascal": 13,
  "serenity peak": 14,
  "miner": 15,
  "silent sanctuary": 16,
  "executioner": 17,
  "royal crypt": 18,
  "graveyard": 19,
  "dark tower": 20,
  "forbidden": 21,
  "trophy": 22,
  "legend": 24,
  "league": 24,
};

export function getRecommendedLevelForArena(arena: number): number {
  if (arena <= 4) return 6;
  if (arena <= 8) return 8;
  if (arena <= 12) return 10;
  if (arena <= 16) return 12;
  if (arena <= 20) return 13;
  return 14;
}

export function resolveArenaByTrophies(trophies: number): number {
  let resolved = 1;
  for (const entry of ARENA_RECOMMENDATIONS) {
    if (trophies >= entry.minTrophies) {
      resolved = entry.arena;
    }
  }
  return resolved;
}

export function resolveArenaByName(arenaName: string | null | undefined): number | null {
  if (!arenaName) return null;
  const normalized = arenaName.toLowerCase();
  for (const [key, arena] of Object.entries(ARENA_NAME_ALIASES)) {
    if (normalized.includes(key)) return arena;
  }
  return null;
}

export function getArenaConfig(arena: number): ArenaRecommendationConfig {
  return (
    ARENA_RECOMMENDATIONS.find((a) => a.arena === arena) ??
    ARENA_RECOMMENDATIONS[ARENA_RECOMMENDATIONS.length - 1]
  );
}
