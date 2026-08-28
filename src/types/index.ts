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
  has_evolution_unlocked?: boolean;
  has_hero_unlocked?: boolean;
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

export interface LeagueInfo {
  unlocked: boolean;
  unlock_trophies: number;
  current_league_number: number | null;
  current_league_name: string | null;
  current_league_icon: string | null;
  best_league_number: number | null;
  best_league_name: string | null;
  best_league_icon: string | null;
  is_absolute_champion: boolean;
  absolute_trophies: number | null;
}

export interface SubscriptionInfo {
  active: boolean;
  is_pro?: boolean;
  expires_at: string | null;
  started_at?: string | null;
  days_left?: number | null;
  trial_used: boolean;
  plan_id?: string | null;
  expired?: boolean;
}

export interface ProPlan {
  id: string;
  title: string;
  description: string;
  stars: number;
  months: number;
  badge?: string | null;
  /** Catalog price when checkout price differs. */
  original_stars?: number | null;
  discount_percent?: number;
  final_price?: number | null;
  max_credits?: number;
  credits_to_use?: number;
  stars_to_pay?: number | null;
}

export interface ProStatus {
  is_pro: boolean;
  started_at: string | null;
  expires_at: string | null;
  days_left: number | null;
  plan_id: string | null;
  trial_used: boolean;
  trial_available: boolean;
  trial_days: number;
  is_trial: boolean;
  expired: boolean;
  plans: ProPlan[];
  referral_discount_active?: boolean;
  referral_discount_expires_at?: string | null;
  referral_discount_percent?: number;
  credits_balance?: number;
  credits_max_share_percent?: number;
}

export interface ProTrialResponse {
  ok: boolean;
  activated: boolean;
  message: string;
  is_pro: boolean;
  expires_at: string | null;
  days_left: number | null;
  plan_id: string | null;
  trial_used: boolean;
  is_trial: boolean;
}

export interface ReferralStatus {
  referral_link: string;
  friends_purchased: number;
  credits_earned_from_referrals: number;
  credits_balance: number;
  credits_reward_amount: number;
  is_pro: boolean;
  pro_expires_at: string | null;
  /** @deprecated Credits v2 — kept for older clients */
  successful_referrals?: number;
  current_progress?: number;
  required_referrals?: number;
  rewards_earned?: number;
  reward_days?: number;
  next_reward_in?: number;
  days_earned_total?: number;
}

export interface ProInvoice {
  ok: boolean;
  plan_id: string;
  stars: number;
  invoice_link: string;
  base_price?: number;
  discount_percent?: number;
  discount_stars?: number;
  final_price?: number;
  available_credits?: number;
  max_credits?: number;
  credits_to_use?: number;
  stars_to_pay?: number;
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
  subscription: SubscriptionInfo;
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
  league?: LeagueInfo | null;
}

export interface BattleLeagueBadge {
  league_number: number;
  league_name: string;
  league_icon: string | null;
  starting_trophies?: number | null;
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
  user_deck_cards?: DeckCard[];
  opponent_deck_cards?: DeckCard[];
  top_reason: string | null;
  timestamp: string;
  played_at?: string;
  is_ranked?: boolean;
  user_league?: BattleLeagueBadge | null;
  opponent_league?: BattleLeagueBadge | null;
}

export interface KeyCardEntry {
  name: string;
  name_ru: string;
  note: string;
}

export interface TacticalDangerCard {
  name: string;
  name_ru: string;
  reason: string;
}

export interface TacticalMatchup {
  early_game: string[];
  mid_game: string[];
  late_game: string[];
  pressure_points: string[];
  critical_interactions: string[];
  danger_cards: TacticalDangerCard[];
  best_openings: string[];
  worst_mistakes: string[];
}

export interface ElixirEfficiency {
  average_cost: number;
  effective_cycle: number;
  cheap_rotation: number;
  punish_speed: number;
  recovery_speed: number;
  double_elixir_power: number;
  overtime_strength: number;
  elixir_profile: string;
  explanations: string[];
}

export interface MatchDifficulty {
  difficulty: number;
  rating: string;
  reasons: string[];
  factors?: Record<string, number>;
}

export interface MatchPlanSaveCard {
  name: string;
  name_ru: string;
  reason: string;
}

export interface MatchPlan {
  game_plan: {
    phase_1: string[];
    phase_2: string[];
    phase_3: string[];
  };
  avoid: string[];
  save_cards: MatchPlanSaveCard[];
  win_condition_window: string;
}

export type CoachConfidence = "high" | "medium" | "low" | "insufficient";

export interface CoachInsight {
  title: string;
  text: string;
  evidence: string[];
  confidence: CoachConfidence | string;
}

export interface BattleCoach {
  main_mistakes: CoachInsight[];
  best_moment: CoachInsight | null;
  turning_point: CoachInsight | null;
  outcome_decider: CoachInsight | null;
  danger_moment: CoachInsight | null;
  counterfactual: CoachInsight | null;
  data_notes: string[];
  sufficient: boolean;
}

export interface BattleDetail {
  index: number;
  won: boolean;
  opponent_name: string;
  opponent_tag?: string;
  trophy_change: number;
  matchup_score: number;
  duration: number;
  played_at?: string;
  crown_score?: string;
  outcome_summary?: string;
  user_deck: string[];
  opponent_deck: string[];
  user_deck_cards?: DeckCard[];
  opponent_deck_cards?: DeckCard[];
  user_stats: { avg_elixir: number; win_conditions: string[]; spells: string[] };
  opponent_stats: { avg_elixir: number; win_conditions: string[]; spells: string[] };
  reasons: string[];
  opponent_threats: string[];
  user_key_cards?: KeyCardEntry[];
  opponent_key_cards?: KeyCardEntry[];
  low_impact_cards?: KeyCardEntry[];
  tactical_matchup?: TacticalMatchup | null;
  user_elixir?: ElixirEfficiency | null;
  opponent_elixir?: ElixirEfficiency | null;
  match_difficulty?: MatchDifficulty | null;
  match_plan?: MatchPlan | null;
  battle_coach?: BattleCoach | null;
  is_ranked?: boolean;
  user_league?: BattleLeagueBadge | null;
  opponent_league?: BattleLeagueBadge | null;
  /** false when Ghosteek Pro is required for the deep analysis blocks. */
  detailed_unlocked?: boolean;
  pro_required?: boolean;
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
  level?: number | null;
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
  type: "meta" | "mine" | "arena" | "rated" | "classic" | "2v2" | "tournament" | "legend_path" | "random" | "constructor" | "constructor_alt";
  category?: string;
  deck_link?: string | null;
  description?: string;
  synergy_score?: number;
  synergy_notes?: string[];
  archetype?: string;
  confidence?: number;
  recommendation?: RecommendationResult | null;
  game_plan?: DeckGamePlan | null;
  improvements?: DeckImprovementSuggestion[];
  score_breakdown?: ScoreBreakdown;
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

export interface MetaHistoryPoint {
  day: string;
  games: number;
}

export interface MetaLadderDeck {
  rank: number;
  deck_hash: string;
  cards: DeckCard[];
  games_count: number;
  wins: number;
  losses: number;
  win_rate: number;
  unique_players: number;
  trend: "up" | "down" | "stable" | string;
  trend_percent: number | null;
  history: MetaHistoryPoint[];
  history_available: boolean;
  last_seen: string | null;
  deck_link?: string | null;
  low_sample: boolean;
}

export interface MetaLadderData {
  mode: string;
  status: string;
  message: string | null;
  sample_note: string;
  updated_at: string | null;
  min_games: number;
  decks: MetaLadderDeck[];
  is_pro?: boolean;
  total_decks?: number;
  pro_locked_count?: number;
}

export interface MetaWarDeck {
  rank: number;
  cards: DeckCard[];
  name: string;
  role: string;
  recommendation: string;
  deck_link?: string | null;
}

export interface MetaWarData {
  mode: string;
  status: string;
  message: string | null;
  source: string;
  source_url: string;
  updated_at: string | null;
  sample_note: string;
  decks: MetaWarDeck[];
  is_pro?: boolean;
  total_decks?: number;
  pro_locked_count?: number;
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
  user_recommendation?: RecommendationResult | null;
  reference_recommendation?: RecommendationResult | null;
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

export interface DeckGamePlan {
  how_to_win: string;
  primary_threat: string;
  when_to_attack: string;
  key_cards: string[];
  core_combinations: string[];
  critical_weaknesses: string[];
}

export interface RecommendationIntent {
  archetype: string;
  play_style: string;
  primary_win: string | null;
  required_soft_checks: string[];
  min_air_defense: number;
  require_building: boolean;
  min_cycle_cards: number;
  required_role_ids: string[];
  attack_bias: number;
}

export interface RecommendationBalanceIssues {
  hard: string[];
  soft: string[];
  messages: string[];
}

export interface CandidateRating {
  card: string;
  strategy_fit: number;
  gameplan_fit: number;
  primary_win_support: number;
  secondary_combo_support: number;
  tempo_fit: number;
  deck_identity: number;
  existing_synergy: number;
  future_synergy: number;
  role_overlap: number;
  replacement_cost: number;
  total: number;
}

export interface RejectedCandidateExplanation {
  card: string;
  reasons: string[];
}

export interface PickExplanation {
  category: string;
  pick: string;
  drop: string | null;
  reason: string;
  pros: string[];
  rejected: RejectedCandidateExplanation[];
}

export interface RecommendationSwap {
  drop: string | null;
  pick: string;
  reason: string;
}

export interface DecisionExplanation {
  archetype: string;
  primary_win: string | null;
  why_gaps: string[];
  why_picks: string[];
  rejected: string[];
  pick_explanations: PickExplanation[];
  swaps?: RecommendationSwap[];
}

export interface RecommendationImprovementStep {
  category: string;
  message: string;
  drop: string | null;
  pick: string | null;
  suggested_cards: string[];
  tier: string | null;
  rating: CandidateRating | null;
  reason?: string | null;
}

export interface DeckCoaching {
  strengths: string[];
  play_style: string;
  key_combinations: string[];
  usage_tips: string[];
  card_choices: {
    card: string;
    roles: string[];
    reason: string;
    synergy: string;
  }[];
}

export interface RecommendationResult {
  intent: RecommendationIntent;
  game_plan: DeckGamePlan;
  balance_issues: RecommendationBalanceIssues;
  improvement_plan: {
    needed: boolean;
    steps: RecommendationImprovementStep[];
    improved_deck: string[];
    locked: string[];
  };
  decision_explanation: DecisionExplanation;
  candidate_ranking: {
    by_gap: Record<string, CandidateRating[]>;
    applied: CandidateRating[];
  };
  risk_assessment: {
    score: number;
    factors: string[];
    open_gaps: string[];
  };
  origin?: "player" | "builder" | string;
  coaching?: DeckCoaching | null;
}

export interface RecommendDeckResponse {
  recommendation: RecommendationResult;
  improvements: DeckImprovementSuggestion[];
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
  game_plan?: DeckGamePlan | null;
  recommendation?: RecommendationResult | null;
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
  collection_level?: number | null;
  arena_icon?: string | null;
  winrate?: number | null;
  total_wins?: number | null;
  total_losses?: number | null;
  recent_winrate?: number | null;
  recent_games?: number;
  favorite_card?: string | null;
  favorite_card_icon?: string | null;
  avatar_url?: string | null;
  cards?: DeckCard[];
  avg_elixir?: number;
  deck_link?: string | null;
  deck_winrate?: number | null;
  deck_games?: number;
  league?: LeagueInfo | null;
}

export type HapticIntensity = "weak" | "standard" | "strong";

export interface Settings {
  theme: "dark" | "light" | "auto";
  language: "ru" | "en";
  /** @deprecated unused — kept for API compat */
  notifications?: boolean;
  telegram_notifications: boolean;
  haptic_enabled: boolean;
  haptic_intensity: HapticIntensity;
}

export interface HomeData {
  profile: Profile;
  battles: BattleSummary[];
  stats: StatsOverview | null;
}

export interface WinrateEntry {
  cards: string[];
  deck_cards?: DeckCard[];
  wins: number;
  losses: number;
  total: number;
  winrate: number;
  /** ISO battle time of the most recent game with this deck (CR API format). */
  last_seen?: string | null;
}

export interface OpponentEntry {
  index: number;
  name: string;
  deck: string[];
  deck_cards?: DeckCard[];
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

export interface CustomizeCardInfo {
  id: string;
  name: string;
  name_ru?: string;
  icon?: string;
  cost?: number;
  level?: number | null;
  recommended_level?: number;
  needs_upgrade?: boolean;
  deficit?: number;
  slot?: number;
}

export interface CustomizeUpgradePriority {
  name: string;
  name_ru?: string;
  level?: number | null;
  recommended_level?: number;
  deficit?: number;
  icon?: string;
}

export interface CustomizeData {
  original: string[];
  customized: string[];
  issues: string[];
  avg_elixir: number;
  deck_link?: string | null;
  recommended_level?: number;
  original_cards?: CustomizeCardInfo[];
  customized_cards?: CustomizeCardInfo[];
  upgrade_priority?: CustomizeUpgradePriority[];
  level_alt_deck?: string[];
  level_alt_cards?: CustomizeCardInfo[];
  level_alt_needed?: boolean;
  level_alt_avg_elixir?: number;
  level_alt_deck_link?: string | null;
  synergy_needed?: boolean;
  balanced?: boolean;
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
  balanced?: boolean;
  score_breakdown?: ScoreBreakdown;
  improvements?: DeckImprovementSuggestion[];
  game_plan?: DeckGamePlan | null;
  recommendation?: RecommendationResult | null;
  is_alternative?: boolean;
}

export interface CoreConflictInfo {
  conflicting_card: string;
  conflicting_card_ru: string;
  reason: string;
  baseline_score: number;
  alternative_score: number;
  quality_gain: number;
  message: string;
  drop_scores?: Record<string, number>;
}

export interface ScoreBreakdown {
  synergy: number;
  offense: number;
  defense: number;
  anti_air: number;
  anti_swarm: number;
  spell_balance: number;
  elixir: number;
  archetype_fit: number;
  total: number;
  hard_issues: string[];
  soft_issues: string[];
}

export interface ConstructorData {
  core: DeckCard[];
  decks: ConstructorDeckEntry[];
  core_conflict?: CoreConflictInfo | null;
  alternative_deck?: ConstructorDeckEntry | null;
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