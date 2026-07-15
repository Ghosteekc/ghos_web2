export interface PlayerCollectionData {
  cards: CollectionCardEntry[];
  cards_owned: number;
  cards_total: number;
  masteries: CollectionMasteryEntry[];
  collection_level: number;
  evolution_count: number;
  hero_count: number;
  champion_count: number;
  legendary_count: number;
  epic_count: number;
  rare_count: number;
  common_count: number;
  cards_by_level: CardLevelCount[];
}

export interface CardLevelCount {
  level: number;
  count: number;
}

export type CardDisplayMode = "base" | "evo" | "hero" | "split";

export interface CollectionCardEntry {
  name: string;
  name_ru: string;
  owned: boolean;
  level: number | null;
  max_level: number | null;
  count: number;
  rarity: string;
  elixir: number | null;
  evolution_level: number;
  max_evolution_level: number;
  display_mode: CardDisplayMode;
  icon: string;
  icon_base: string;
  icon_evo: string;
  icon_hero: string;
}

export interface CollectionMasteryEntry {
  card_name: string;
  card_name_ru: string;
  icon: string;
  icon_base: string;
  icon_evo: string;
  icon_hero: string;
  display_mode: CardDisplayMode;
  level: number;
  max_level: number;
  progress: number;
  target: number | null;
  progress_percent: number;
  next_hint: string;
}

export interface Profile {
  player_tag: string | null;
  player_name: string | null;
  trophies: number | null;
  exp_level: number | null;
  arena_name: string | null;
  arena_icon: string | null;
  avatar_url: string | null;
  favorite_card: string | null;
  favorite_card_icon: string | null;
  subscription: { active: boolean; expires_at: string | null; trial_used: boolean };
  skill_rating: number | null;
  winrate: number | null;
  last_rating_change: number | null;
  daily_trophy_change: number | null;
  max_trophies: number | null;
  clan_name: string | null;
  total_wins: number | null;
  three_crown_wins: number | null;
  collection_level: number | null;
  cards_by_level: CardLevelCount[];
}

export interface BattleSummary {
  index: number;
  opponent_name: string;
  opponent_tag: string;
  opponent_trophies: number;
  won: boolean;
  trophy_change: number;
  matchup_score: number | null;
  duration: number;
  avg_elixir: number;
  user_deck: string[];
  opponent_deck: string[];
  top_reason: string | null;
  timestamp: string;
  played_at?: string;
}

export interface KeyCardEntry {
  name: string;
  name_ru: string;
  note: string;
}

export interface BattleDetail {
  index: number;
  won: boolean;
  opponent_name: string;
  trophy_change: number;
  matchup_score: number;
  duration: number;
  played_at?: string;
  crown_score?: string;
  outcome_summary?: string;
  user_deck: string[];
  opponent_deck: string[];
  user_stats: { avg_elixir: number; win_conditions: string[]; spells: string[] };
  opponent_stats: { avg_elixir: number; win_conditions: string[]; spells: string[] };
  reasons: string[];
  opponent_threats: string[];
  user_key_cards?: KeyCardEntry[];
  opponent_key_cards?: KeyCardEntry[];
  low_impact_cards?: KeyCardEntry[];
}

export interface DeckCard {
  id: string;
  name: string;
  icon: string;
  rarity?: string;
  cost: number;
  evolution_level?: number;
  is_hero?: boolean;
  slot?: number;
}

export interface Deck {
  id: number;
  name: string;
  cards: DeckCard[];
  winrate: number;
  total_games: number;
  avg_elixir: number;
  best_matchups: BattleSummary[];
  worst_matchups: BattleSummary[];
  type: "meta" | "mine" | "arena" | "rated" | "classic" | "2v2" | "tournament" | "legend_path" | "random" | "constructor";
  category?: string;
  deck_link?: string | null;
  description?: string;
  synergy_score?: number;
  synergy_notes?: string[];
}

export interface CardInfo {
  id: string;
  name: string;
  rarity: string;
  type: string;
  cost: number;
  icon: string;
  hp: number;
  dps: number;
  range: number;
  hitspeed: number;
  winrate: number;
  usage: number;
  popularity: number;
  best_synergies: string[];
  worst_counters: string[];
}

export interface StatsOverview {
  total_battles: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
  avg_elixir: number;
  max_trophies: number;
  winrate_by_day: { date: string; wins: number; losses: number; winrate: number }[];
  winrate_by_hour: { hour: number; wins: number; total: number }[];
  best_cards: { name: string; count: number }[];
  most_used_cards: { name: string; count: number; winrate: number }[];
  archetypes: { name: string; value: number }[];
  last_results: {
    won: boolean;
    trophy_change: number;
    opponent_name?: string;
    played_date?: string;
    played_time?: string;
  }[];
  activity_heatmap: number[][];
  avg_time?: number;
}

export interface TopPlayer {
  rank: number;
  player_tag: string;
  player_name: string;
  trophies: number;
  clan_name: string;
  winrate: number;
  total_games: number;
  avg_elixir: number;
  cards: DeckCard[];
  deck_link?: string | null;
}

export interface TopPlayersData {
  players: TopPlayer[];
  updated_at: string | null;
}

export interface DecksListData {
  decks: Deck[];
  meta_updated_at?: string | null;
  meta_source?: string | null;
}

export interface ArenaDecksData {
  arena_name: string;
  arena_id: number | null;
  trophies: number;
  decks: Deck[];
  source: string;
  updated_at: string | null;
}

export interface DeckCompareCardNote {
  card: string;
  card_ru: string;
  tone: "good" | "warn" | "bad" | "neutral" | string;
  text: string;
}

export interface DeckCompareResult {
  reference_name: string;
  user_deck: DeckCard[];
  reference_deck: DeckCard[];
  user_better: string[];
  user_worse: string[];
  reference_better: string[];
  reference_worse: string[];
  user_card_notes: DeckCompareCardNote[];
  reference_card_notes: DeckCompareCardNote[];
  matchup_score: number;
  opponent_matchup_score: number;
  user_synergy_score?: number;
  reference_synergy_score?: number;
  user_synergy_notes?: string[];
  reference_synergy_notes?: string[];
}

export interface DeckCardMatchup {
  card: string;
  card_ru: string;
  winrate: number;
  games: number;
  reason: string;
}

export interface DeckImprovementSuggestion {
  category: string;
  message: string;
  suggested_cards: string[];
}

export interface MineDeckStats {
  name: string;
  cards: DeckCard[];
  wins: number;
  losses: number;
  total_games: number;
  winrate: number;
  avg_elixir: number;
  win_conditions: string[];
  strong_against: DeckCardMatchup[];
  weak_against: DeckCardMatchup[];
  improvements: DeckImprovementSuggestion[];
  balanced: boolean;
  sample_note: string;
}

export interface RandomDeck {
  cards: string[];
  card_infos: { id: string; name: string; icon: string; cost: number }[];
  avg_elixir: number;
  deck_link?: string | null;
  rofl?: boolean;
  rofl_name?: string | null;
  rofl_tagline?: string | null;
  rofl_key?: string | null;
}

export interface BattleInsight {
  battle_index: number;
  won: boolean;
  opponent_name: string;
  summary: string;
  matchup_score: number;
  details: string[];
  timestamp: string;
}

export interface InsightsData {
  insights: BattleInsight[];
  patterns: string[];
  sample_size: number;
  wins: number;
  losses: number;
}

export interface SearchResult {
  player_tag: string;
  player_name: string;
  trophies: number;
  arena: string;
  max_trophies?: number | null;
  clan_name?: string | null;
  exp_level?: number | null;
}

export interface Settings {
  theme: "dark" | "light" | "auto";
  language: "ru" | "en";
  notifications: boolean;
  telegram_notifications: boolean;
}

export interface HomeData {
  profile: Profile;
  battles: BattleSummary[];
  stats: StatsOverview | null;
}

export interface WinrateEntry {
  cards: string[];
  wins: number;
  losses: number;
  total: number;
  winrate: number;
}

export interface OpponentEntry {
  index: number;
  name: string;
  deck: string[];
  threats: string[];
  avg_elixir: number;
  won_against: boolean;
}

export interface CounterDeckData {
  opponent_name: string;
  opponent_deck: string[];
  counter_deck: string[];
  threats: string[];
  preferred_cards: string[];
}

export interface CustomizeData {
  original: string[];
  customized: string[];
  issues: string[];
  avg_elixir: number;
  deck_link?: string | null;
}

export interface SynergyData {
  core: string[];
  deck: string[];
  synergies: Record<string, string[]>;
  avg_elixir: number;
  deck_link?: string | null;
}

export interface ConstructorDeckEntry {
  id: number;
  name: string;
  cards: DeckCard[];
  synergy_score: number;
  synergy_notes: string[];
  avg_elixir: number;
  deck_link?: string | null;
  description: string;
  type: string;
  category: string;
  archetype?: string;
  confidence?: number;
}

export interface ConstructorData {
  core: DeckCard[];
  decks: ConstructorDeckEntry[];
}

export type TabType =
  | "home"
  | "profile"
  | "analytics"
  | "decks"
  | "battles"
  | "search"
  | "favorites"
  | "settings";