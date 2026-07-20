export interface ArenaRecommendationConfig {
  arena: number;
  name: string;
  minTrophies: number;
  priorityCards: string[];
}

/** Русские названия и пороги кубков (Trophy Road, актуально на 2026). */
const ARENA_DEFINITIONS: { name: string; minTrophies: number }[] = [
  { name: "Гоблинский стадион", minTrophies: 0 },
  { name: "Костяная яма", minTrophies: 300 },
  { name: "Варварская арена", minTrophies: 600 },
  { name: "Долина чар", minTrophies: 1000 },
  { name: "Мастерская строителя", minTrophies: 1300 },
  { name: "Игровой домик П.Е.К.К.А.", minTrophies: 1600 },
  { name: "Королевская арена", minTrophies: 2000 },
  { name: "Ледяной пик", minTrophies: 2300 },
  { name: "Арена в джунглях", minTrophies: 2600 },
  { name: "Кабанья гора", minTrophies: 3000 },
  { name: "Электрическая долина", minTrophies: 3400 },
  { name: "Жуткий город", minTrophies: 3800 },
  { name: "Убежище разбойников", minTrophies: 4200 },
  { name: "Пик просветления", minTrophies: 4600 },
  { name: "Шахта", minTrophies: 5000 },
  { name: "Кухня палача", minTrophies: 5500 },
  { name: "Королевская гробница", minTrophies: 6000 },
  { name: "Тихая обитель", minTrophies: 6500 },
  { name: "Драконья купальня", minTrophies: 7000 },
  { name: "Тренировочный лагерь", minTrophies: 7500 },
  { name: "Clash Fest", minTrophies: 8000 },
  { name: "БЛИНЧИКИ!", minTrophies: 8500 },
  { name: "Valkalla", minTrophies: 9000 },
  { name: "Легендарная арена", minTrophies: 9500 },
  { name: "Lumberlove Cabin", minTrophies: 10000 },
  { name: "Royal Road", minTrophies: 10500 },
  { name: "Musketeer Street", minTrophies: 11000 },
  { name: "Summit of Heroes", minTrophies: 11500 },
  { name: "Magic Academy", minTrophies: 12000 },
  { name: "Ultimate Clash Pit", minTrophies: 12500 },
  { name: "Little Prince's Tavern", minTrophies: 13000 },
  { name: "Spirit Square", minTrophies: 13500 },
];

const EARLY_CARDS = [
  "Knight", "Archers", "Goblins", "Fireball", "Giant", "Musketeer", "Mini P.E.K.K.A", "Zap",
];
const MID_CARDS = [
  "Knight", "Archers", "Fireball", "Hog Rider", "Valkyrie", "Wizard", "Mega Minion", "The Log",
];
const HIGH_CARDS = [
  "Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Hog Rider", "The Log",
];
const TOP_CARDS = [
  "Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Phoenix", "The Log",
];
const LEGEND_CARDS = [
  "Fireball", "Knight", "Skeletons", "Tesla", "Poison", "Miner", "Archer Queen", "The Log",
];

function priorityCardsForArena(arena: number): string[] {
  if (arena <= 4) return EARLY_CARDS;
  if (arena <= 8) return MID_CARDS.slice(0, 8);
  if (arena <= 14) return HIGH_CARDS;
  if (arena <= 23) return TOP_CARDS;
  return LEGEND_CARDS;
}

/** Trophy Road arenas 1–32 in unlock order. */
export const ARENA_RECOMMENDATIONS: ArenaRecommendationConfig[] = ARENA_DEFINITIONS.map(
  (entry, index) => ({
    arena: index + 1,
    name: entry.name,
    minTrophies: entry.minTrophies,
    priorityCards: priorityCardsForArena(index + 1),
  }),
);

/** English API arena names → our arena number (partial match). */
const ARENA_NAME_ALIASES: Record<string, number> = {
  "goblin stadium": 1,
  "goblin": 1,
  "bone pit": 2,
  "barbarian bowl": 3,
  "barbarian": 3,
  "spell valley": 4,
  "charm valley": 4,
  "builder": 5,
  "p.e.k.k.a": 6,
  "pekka": 6,
  "playhouse": 6,
  "royal arena": 7,
  "frozen peak": 8,
  "jungle": 9,
  "hog mountain": 10,
  "electro valley": 11,
  "electro": 11,
  "spooky town": 12,
  "rascal": 13,
  "serenity peak": 14,
  "miner": 15,
  "executioner": 16,
  "royal crypt": 17,
  "silent sanctuary": 18,
  "dragon spa": 19,
  "boot camp": 20,
  "training camp": 20,
  "clash fest": 21,
  "pancake": 22,
  "блин": 22,
  "valkalla": 23,
  "legendary arena": 24,
  "legendary": 24,
  "lumberlove": 25,
  "royal road": 26,
  "musketeer street": 27,
  "summit of heroes": 28,
  "magic academy": 29,
  "ultimate clash pit": 30,
  "little prince": 31,
  "spirit square": 32,
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

export const LAST_ARENA_NUMBER = ARENA_RECOMMENDATIONS.length;
