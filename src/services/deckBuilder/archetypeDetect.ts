/**
 * Мультифакторное определение архетипа.
 * Зеркало bot/services/deck_builder/archetype_detect.py.
 * Публичный API — detectArchetype() в builder.ts без смены сигнатуры.
 */

import {
  ARCHETYPE_ANCHORS,
  ARCHETYPE_ELIXIR,
  ARCHETYPE_PRIMARY_WIN,
  DEFAULT_ELIXIR_MAX,
  DEFAULT_ELIXIR_MIN,
  WIN_CONDITIONS,
} from "./constants";
import { avgElixir, cardHasRole, getCardMeta } from "./database";

const W_WIN = 0.26;
const W_ELIXIR = 0.14;
const W_ANCHORS = 0.14;
const W_CYCLE = 0.1;
const W_SUPPORT = 0.08;
const W_SPELLS = 0.08;
const W_BUILDINGS = 0.08;
const W_DEFENSE = 0.06;
const W_ATTACK = 0.06;

const ARCHETYPE_STYLE: Record<
  string,
  {
    min_cycle: number;
    building_want: number;
    attack: string;
    defense: string;
    support_want: number;
  }
> = {
  Cycle: { min_cycle: 2, building_want: 0.25, attack: "pressure", defense: "cheap", support_want: 1 },
  "Log Bait": { min_cycle: 1, building_want: 0.2, attack: "bait", defense: "swarm", support_want: 1 },
  "Fireball Bait": { min_cycle: 1, building_want: 0.2, attack: "bait", defense: "swarm", support_want: 1 },
  Beatdown: { min_cycle: 0, building_want: 0.15, attack: "tank_push", defense: "counter", support_want: 2 },
  Lava: { min_cycle: 0, building_want: 0.1, attack: "air_push", defense: "ground", support_want: 2 },
  "Bridge Spam": { min_cycle: 0, building_want: 0.15, attack: "bridge", defense: "reactive", support_want: 2 },
  Siege: { min_cycle: 1, building_want: 1.0, attack: "siege", defense: "building", support_want: 1 },
  Control: { min_cycle: 1, building_want: 0.7, attack: "chip", defense: "building", support_want: 1 },
  Graveyard: { min_cycle: 0, building_want: 0.35, attack: "spell_bait", defense: "tanky", support_want: 2 },
  "Royal Giant": { min_cycle: 0, building_want: 0.35, attack: "rg", defense: "building", support_want: 2 },
  "Split Lane": { min_cycle: 2, building_want: 0.2, attack: "split", defense: "cheap", support_want: 1 },
  Meta: { min_cycle: 0, building_want: 0.3, attack: "hybrid", defense: "hybrid", support_want: 1 },
};

const BAIT_MARKERS = new Set([
  "Princess", "Goblin Gang", "Dart Goblin", "Goblin Barrel", "Skeleton Barrel",
  "Firecracker", "Wall Breakers",
]);
const BRIDGE_MARKERS = new Set([
  "Bandit", "Royal Ghost", "Battle Ram", "Ram Rider", "Dark Prince",
  "Elite Barbarians", "Boss Bandit",
]);
const SIEGE_MARKERS = new Set(["X-Bow", "Mortar", "Tesla", "Cannon", "Inferno Tower"]);
const TANK_MARKERS = new Set([
  "Golem", "Electro Giant", "Giant", "Elixir Golem", "Lava Hound", "Goblin Giant",
]);

interface DeckSignals {
  cards: Set<string>;
  avgElixir: number;
  wins: string[];
  primaryWin: string | null;
  cycleN: number;
  buildingN: number;
  spellN: number;
  bigSpell: boolean;
  smallSpell: boolean;
  supportN: number;
  tankN: number;
  miniTankN: number;
  defensiveN: number;
  counterpushN: number;
  splashN: number;
  airN: number;
  dpsN: number;
}

function countRole(cards: string[], role: string): number {
  return cards.filter((c) => cardHasRole(c, role)).length;
}

function extractSignals(cards: string[]): DeckSignals {
  const avg = avgElixir(cards);
  const wins = cards.filter((c) => WIN_CONDITIONS.has(c) || cardHasRole(c, "win_condition"));
  const primary =
    wins.find((c) => WIN_CONDITIONS.has(c)) ?? wins[0] ?? null;
  const cycleN = cards.filter(
    (c) => cardHasRole(c, "cycle") || (getCardMeta(c)?.elixir ?? 4) <= 2,
  ).length;

  return {
    cards: new Set(cards),
    avgElixir: avg,
    wins,
    primaryWin: primary,
    cycleN,
    buildingN: countRole(cards, "building"),
    spellN: countRole(cards, "spell"),
    bigSpell: cards.some((c) => cardHasRole(c, "big_spell")),
    smallSpell: cards.some((c) => cardHasRole(c, "small_spell")),
    supportN: countRole(cards, "support") + countRole(cards, "dps"),
    tankN: countRole(cards, "tank"),
    miniTankN: countRole(cards, "mini_tank"),
    defensiveN: countRole(cards, "defensive"),
    counterpushN: countRole(cards, "counterpush"),
    splashN: countRole(cards, "splash"),
    airN: countRole(cards, "air_defense"),
    dpsN: countRole(cards, "dps"),
  };
}

function intersectCount(a: Set<string>, b: ReadonlySet<string> | Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n += 1;
  return n;
}

function scoreWin(sig: DeckSignals, archetype: string): number {
  const primaryList = ARCHETYPE_PRIMARY_WIN[archetype] ?? [];
  const hits = sig.wins.filter((w) => primaryList.includes(w));
  if (hits.length) {
    return sig.primaryWin && primaryList.includes(sig.primaryWin) ? 100 : 82;
  }

  const anchors = ARCHETYPE_ANCHORS[archetype] ?? new Set<string>();
  if ([...sig.cards].some((c) => anchors.has(c) && WIN_CONDITIONS.has(c))) return 55;

  if (archetype === "Lava") {
    if (sig.cards.has("Lava Hound") && sig.cards.has("Balloon")) return 70;
    if (sig.cards.has("Lava Hound") || sig.cards.has("Balloon")) return 48;
  }
  if (archetype === "Bridge Spam" && intersectCount(sig.cards, BRIDGE_MARKERS)) return 50;
  if (archetype === "Beatdown" && intersectCount(sig.cards, TANK_MARKERS)) return 45;
  if (archetype === "Siege" && (sig.cards.has("X-Bow") || sig.cards.has("Mortar"))) return 75;
  if (archetype === "Log Bait" && sig.cards.has("Goblin Barrel")) return 60;
  if (
    archetype === "Split Lane" &&
    (sig.cards.has("Royal Hogs") || sig.cards.has("Wall Breakers"))
  ) {
    return 65;
  }
  if (!sig.wins.length) return 35;
  return 12;
}

function scoreElixir(sig: DeckSignals, archetype: string): number {
  const [lo, hi] = ARCHETYPE_ELIXIR[archetype] ?? [DEFAULT_ELIXIR_MIN, DEFAULT_ELIXIR_MAX];
  const mid = (lo + hi) / 2;
  const avg = sig.avgElixir;
  if (avg >= lo && avg <= hi) {
    const span = Math.max(hi - lo, 0.1);
    return 100 - (Math.abs(avg - mid) / span) * 25;
  }
  const dist = avg < lo ? lo - avg : avg - hi;
  return Math.max(0, 55 - dist * 45);
}

function scoreAnchors(sig: DeckSignals, archetype: string): number {
  const anchors = ARCHETYPE_ANCHORS[archetype];
  if (!anchors || anchors.size === 0) return 45;
  const hits = intersectCount(sig.cards, anchors);
  if (!hits) return 8;
  return Math.min(100, 28 + hits * 28);
}

function scoreCycle(sig: DeckSignals, archetype: string): number {
  const style = ARCHETYPE_STYLE[archetype] ?? ARCHETYPE_STYLE.Meta;
  const want = style.min_cycle;
  const n = sig.cycleN;
  if (want <= 0) {
    if (n >= 4) return 45;
    return 70 + Math.min(20, (2 - Math.min(n, 2)) * 5);
  }
  if (n >= want) return Math.min(100, 70 + (n - want) * 10);
  return Math.max(0, 55 * (n / Math.max(want, 1)));
}

function scoreSupport(sig: DeckSignals, archetype: string): number {
  const style = ARCHETYPE_STYLE[archetype] ?? ARCHETYPE_STYLE.Meta;
  const want = style.support_want;
  const n = sig.supportN + sig.miniTankN;
  if (n >= want) return Math.min(100, 75 + (n - want) * 8);
  return Math.max(15, 75 * (n / Math.max(want, 1)));
}

function scoreSpells(sig: DeckSignals, archetype: string): number {
  let score = 40;
  if (sig.bigSpell) score += 25;
  if (sig.smallSpell) score += 25;
  if (sig.spellN >= 2) score += 10;

  if (archetype === "Log Bait" || archetype === "Fireball Bait") {
    if (sig.cards.has("The Log") || sig.cards.has("Barbarian Barrel")) score += 15;
    if (intersectCount(sig.cards, BAIT_MARKERS)) score += 10;
  }
  if (
    archetype === "Graveyard" &&
    (sig.cards.has("Poison") || sig.cards.has("Freeze") || sig.cards.has("Tornado"))
  ) {
    score += 12;
  }
  if (archetype === "Siege" && sig.bigSpell) score += 8;
  return Math.min(100, score);
}

function scoreBuildings(sig: DeckSignals, archetype: string): number {
  const style = ARCHETYPE_STYLE[archetype] ?? ARCHETYPE_STYLE.Meta;
  const want = style.building_want;
  const n = sig.buildingN;
  if (want >= 0.7) {
    if (n >= 1) return 90 + Math.min(10, (n - 1) * 5);
    return 15;
  }
  if (want <= 0.2) return n <= 1 ? 75 : 55;
  return n >= 1 ? 80 : 45;
}

function scoreDefense(sig: DeckSignals, archetype: string): number {
  const style = ARCHETYPE_STYLE[archetype] ?? ARCHETYPE_STYLE.Meta;
  const defense = style.defense;
  let score = 40;

  if (defense === "building") {
    score += sig.buildingN * 28;
    score += Math.min(20, sig.defensiveN * 10);
  } else if (defense === "cheap") {
    score += Math.min(35, sig.cycleN * 12);
    score += Math.min(20, sig.airN * 10);
  } else if (defense === "swarm") {
    score += Math.min(30, sig.splashN * 12);
    if (sig.smallSpell) score += 15;
  } else if (defense === "counter") {
    score += Math.min(25, sig.counterpushN * 12);
    score += Math.min(20, sig.splashN * 8);
  } else if (defense === "tanky") {
    score += Math.min(25, sig.miniTankN * 12);
    score += Math.min(20, sig.defensiveN * 10);
  } else if (defense === "ground") {
    score += Math.min(30, (sig.splashN + sig.defensiveN + sig.dpsN) * 6);
  } else {
    score += Math.min(20, (sig.defensiveN + sig.airN + sig.buildingN) * 6);
  }
  return Math.min(100, score);
}

function scoreAttack(sig: DeckSignals, archetype: string): number {
  const style = ARCHETYPE_STYLE[archetype] ?? ARCHETYPE_STYLE.Meta;
  const attack = style.attack;
  let score = 35;

  if (attack === "pressure") {
    if (["Hog Rider", "Miner", "Wall Breakers", "Mortar"].includes(sig.primaryWin ?? "")) {
      score += 40;
    }
    score += Math.min(20, sig.cycleN * 5);
  } else if (attack === "tank_push") {
    score += Math.min(45, sig.tankN * 22);
    if (intersectCount(sig.cards, TANK_MARKERS)) score += 20;
    score += Math.min(15, sig.supportN * 5);
  } else if (attack === "air_push") {
    if (sig.cards.has("Lava Hound")) score += 45;
    if (sig.cards.has("Balloon")) score += 25;
  } else if (attack === "bridge") {
    score += Math.min(50, intersectCount(sig.cards, BRIDGE_MARKERS) * 18);
    score += Math.min(20, sig.miniTankN * 8);
    score += Math.min(15, sig.counterpushN * 7);
  } else if (attack === "siege") {
    if (sig.cards.has("X-Bow") || sig.cards.has("Mortar")) score += 55;
    score += Math.min(20, intersectCount(sig.cards, SIEGE_MARKERS) * 8);
  } else if (attack === "bait") {
    score += Math.min(50, intersectCount(sig.cards, BAIT_MARKERS) * 14);
  } else if (attack === "chip") {
    if (["Miner", "Goblin Drill", "Graveyard"].includes(sig.primaryWin ?? "")) score += 40;
    if (sig.bigSpell) score += 15;
  } else if (attack === "spell_bait") {
    if (sig.cards.has("Graveyard")) score += 50;
    if (sig.miniTankN) score += 15;
  } else if (attack === "rg") {
    if (sig.cards.has("Royal Giant")) score += 55;
    if (sig.cards.has("Fisherman") || sig.cards.has("Hunter")) score += 20;
  } else if (attack === "split") {
    const split = ["Royal Hogs", "Wall Breakers", "Miner"].filter((c) => sig.cards.has(c)).length;
    score += Math.min(55, split * 22);
  } else if (sig.wins.length) {
    score += 20;
  }

  return Math.min(100, score);
}

export function scoreArchetype(cards: string[], archetype: string): number {
  const sig = extractSignals(cards);
  const total =
    scoreWin(sig, archetype) * W_WIN +
    scoreElixir(sig, archetype) * W_ELIXIR +
    scoreAnchors(sig, archetype) * W_ANCHORS +
    scoreCycle(sig, archetype) * W_CYCLE +
    scoreSupport(sig, archetype) * W_SUPPORT +
    scoreSpells(sig, archetype) * W_SPELLS +
    scoreBuildings(sig, archetype) * W_BUILDINGS +
    scoreDefense(sig, archetype) * W_DEFENSE +
    scoreAttack(sig, archetype) * W_ATTACK;
  return Math.round(total * 100) / 100;
}

export function detectArchetypeFromCards(cards: string[]): string {
  if (!cards.length) return "Meta";

  const candidates = new Set<string>([
    ...Object.keys(ARCHETYPE_ANCHORS),
    ...Object.keys(ARCHETYPE_PRIMARY_WIN),
    ...Object.keys(ARCHETYPE_ELIXIR),
  ]);
  candidates.delete("Meta");

  let best = "Meta";
  let bestScore = -1;
  for (const arch of candidates) {
    const s = scoreArchetype(cards, arch);
    if (s > bestScore) {
      bestScore = s;
      best = arch;
    }
  }

  const metaScore = scoreArchetype(cards, "Meta");
  if (bestScore < 42 || metaScore >= bestScore + 2) return "Meta";

  const anchors = ARCHETYPE_ANCHORS[best] ?? new Set<string>();
  const cardSet = new Set(cards);
  const strict = new Set([
    "Lava",
    "Siege",
    "Bridge Spam",
    "Graveyard",
    "Log Bait",
    "Royal Giant",
    "Fireball Bait",
  ]);
  if (strict.has(best)) {
    let hit = false;
    for (const a of anchors) {
      if (cardSet.has(a)) {
        hit = true;
        break;
      }
    }
    if (!hit) return "Meta";
    if (best === "Lava" && !cardSet.has("Lava Hound") && !cardSet.has("Balloon")) return "Meta";
    if (best === "Siege" && !cardSet.has("X-Bow") && !cardSet.has("Mortar")) return "Meta";
    if (best === "Bridge Spam" && !intersectCount(cardSet, BRIDGE_MARKERS)) return "Meta";
    if (
      best === "Fireball Bait" &&
      !cardSet.has("Goblin Barrel") &&
      !cardSet.has("Princess") &&
      !cardSet.has("Dart Goblin")
    ) {
      return "Meta";
    }
    if (best === "Log Bait" && !cardSet.has("Goblin Barrel")) return "Meta";
  }

  return best;
}
