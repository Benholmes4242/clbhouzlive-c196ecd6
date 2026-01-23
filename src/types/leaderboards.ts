/**
 * TypeScript types for Exploration & Handicap Leaderboards
 * Updated to match actual RPC return values
 */

export type LeaderboardScope = 'global' | 'friends' | 'club';

export interface CountriesLeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
  countries_count: number;
  rank: number;
}

export interface RegionsLeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
  regions_count: number;
  rank: number;
}

export interface HandicapImprovementEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
  handicap_before: number;
  handicap_current: number;
  improvement: number;
  rank: number;
}

export interface LowestHandicapEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
  handicap_index: number;
  rank: number;
}

export interface SeasonImprovementEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
  start_handicap: number;
  current_handicap: number;
  improvement: number;
  rank: number;
}

export interface UserExplorationStatus {
  countries_visited: number;
  regions_completed: number;
  total_courses_logged: number;
  countries_rank: number;
  regions_rank: number;
}

export interface UserHandicapStatus {
  current_handicap: number | null;
  handicap_rank: number | null;
  improvement_30d: number | null;
  improvement_season: number | null;
  show_handicap: boolean;
}

// Leaderboard category types for navigation
export type LeaderboardCategory = 'championships' | 'exploration' | 'handicap';

export type ExplorationTab = 'countries' | 'regions';

export type HandicapTab = 'improvement-30d' | 'lowest' | 'season';
