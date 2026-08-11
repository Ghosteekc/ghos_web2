/** Legendary cards for practicality cost estimation */
export const LEGENDARY_CARDS = new Set([
  "Princess", "Ice Wizard", "Lava Hound", "Graveyard", "Sparky", "Miner", "Bandit",
  "Night Witch", "Royal Ghost", "Ram Rider", "Magic Archer", "Lumberjack", "Inferno Dragon",
  "Electro Wizard", "Mega Knight", "Phoenix", "Mother Witch", "Golden Knight", "Skeleton King",
  "Archer Queen", "Mighty Miner", "Monk", "Little Prince", "Boss Bandit", "Goblinstein",
]);

export const CHAMPION_CARDS = new Set([
  "Golden Knight", "Skeleton King", "Archer Queen", "Mighty Miner", "Monk", "Little Prince",
  "Boss Bandit", "Goblinstein",
]);

/** Flying units (is_flying) — not anti-air. Prefer cardIsFlying() / role "flying". */
export const AIR_UNITS = new Set([
  "Minions", "Minion Horde", "Balloon", "Lava Hound", "Baby Dragon", "Inferno Dragon",
  "Mega Minion", "Bats", "Phoenix", "Electro Dragon", "Flying Machine", "Skeleton Barrel",
  "Skeleton Dragons",
]);

export const METRIC_WEIGHTS = {
  attack: 1,
  defense: 1,
  control: 0.9,
  counterpush: 0.9,
  cycleSpeed: 0.85,
  antiAir: 1,
  antiGround: 0.9,
  antiTank: 1,
  swarmDefense: 1,
  versatility: 0.85,
  stability: 1.1,
} as const;

export function scoreToStars(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

export function starsDisplay(count: number): string {
  return "★".repeat(count) + "☆".repeat(Math.max(0, 5 - count));
}

export function clampMetric(value: number): number {
  return Math.round(Math.min(10, Math.max(0, value)) * 10) / 10;
}

export function clampPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}
