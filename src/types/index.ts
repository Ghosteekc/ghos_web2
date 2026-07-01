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
  max_trophies: number | null;
  clan_name: string | null;
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
}

export interface BattleDetail {
  index: number;
  won: boolean;
  opponent_name: string;
  opponent_tag: string;
  opponent_trophies: number;
  trophy_change: number;
  matchup_score: number;
  duration: number;
  avg_elixir: number;
  best_moment: string | null;
  user_deck: string[];
  opponent_deck: string[];
  user_stats: { avg_elixir: number; win_conditions: string[]; spells: string[] };
  opponent_stats: { avg_elixir: number; win_conditions: string[]; spells: string[] };
  reasons: string[];
  opponent_threats: string[];
}

export interface Deck {
  id: number;
  name: string;
  cards: { id: string; name: string; icon: string; rarity: string; cost: number }[];
  winrate: number;
  total_games: number;
  avg_elixir: number;
  best_matchups: BattleSummary[];
  worst_matchups: BattleSummary[];
  type: "meta" | "mine" | "rated" | "classic" | "2v2" | "tournament" | "legend_path";
  category?: string;
  deck_link?: string | null;
  description?: string;
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
  winrate_by_day: { date: string; wins: number; losses: number }[];
  winrate_by_hour: { hour: number; wins: number; total: number }[];
  best_cards: { name: string; count: number }[];
  most_used_cards: { name: string; count: number; winrate: number }[];
  archetypes: { name: string; value: number }[];
  last_results: { won: boolean; trophy_change: number }[];
  activity_heatmap: number[][];
  avg_time?: number;
}

export interface SearchResult {
  player_tag: string;
  player_name: string;
  trophies: number;
  arena: string;
}

export interface Settings {
  theme: "dark" | "light" | "auto";
  language: "ru" | "en";
  notifications: boolean;
  telegram_notifications: boolean;
}

export type TabType =
  | "home"
  | "profile"
  | "analytics"
  | "decks"
  | "battles"
  | "stats"
  | "search"
  | "favorites"
  | "settings";