/**
 * TypeScript types for Exploration & Handicap Leaderboards
 * Updated to match actual RPC return values
 */

export type LeaderboardScope = 'global' | 'friends' | 'club' | 'country';
export type ExplorationMetric = 'countries' | 'continents' | 'courses';

export interface ExplorationLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  countries_count: number;
  country_list: string[];
  continents_count: number;
  continent_list: string[];
  regions_count: number;
  region_list: string[];
  courses_count: number;
  home_club: string | null;
  home_club_id: string | null;
  is_current_user: boolean;
  is_friend: boolean;
}

// Legacy alias for backward compatibility
export interface CountriesLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  countries_count: number;
  courses_count: number;
  home_club: string | null;
  is_current_user: boolean;
  is_friend: boolean;
}

export interface HandicapImprovementEntry {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  improvement: number;
  handicap_before: number;
  current_handicap: number;
  is_current_user: boolean;
}

export interface LowestHandicapEntry {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  handicap_index: number;
  home_club: string | null;
  is_current_user: boolean;
}

export interface SeasonImprovementEntry {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  improvement: number;
  start_handicap: number;
  current_handicap: number;
  is_current_user: boolean;
}

export interface UserExplorationStatus {
  countries_count: number;
  country_list: string[];
  continents_count: number;
  continent_list: string[];
  regions_count: number;
  region_list: string[];
  global_rank: number;
  friends_rank: number;
}

export interface UserHandicapStatus {
  current_handicap: number | null;
  handicap_rank: number | null;
  improvement_30d: number | null;
  improvement_season: number | null;
  show_handicap: boolean;
}

export interface ClubSearchResult {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  member_count: number;
}

// Leaderboard category types for navigation
export type LeaderboardCategory = 'championships' | 'exploration' | 'handicap';

export type HandicapTab = 'improvement-30d' | 'lowest' | 'season';
