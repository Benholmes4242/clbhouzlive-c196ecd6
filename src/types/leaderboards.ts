/**
 * TypeScript types for Exploration & Handicap Leaderboards
 */

export type LeaderboardScope = 'global' | 'friends' | 'club';

export interface CountriesLeaderboardEntry {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  countries_played: number;
  country_list: string[];
  recent_countries: string[];
  rank: number;
  is_friend: boolean;
}

export interface RegionsLeaderboardEntry {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  regions_completed: number;
  total_regions: number;
  region_list: string[];
  completion_percentage: number;
  rank: number;
  is_friend: boolean;
}

export interface HandicapImprovementEntry {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  handicap_before: number;
  handicap_current: number;
  improvement: number;
  rounds_in_period: number;
  rank: number;
  is_friend: boolean;
  is_big_mover: boolean;
}

export interface LowestHandicapEntry {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  primary_club_id: string | null;
  current_handicap: number;
  rank: number;
  is_friend: boolean;
}

export interface SeasonImprovementEntry {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  handicap_season_start: number;
  handicap_current: number;
  improvement: number;
  rank: number;
  is_friend: boolean;
  season_name: string;
  days_remaining: number;
}

export interface UserExplorationStatus {
  countries_played: number;
  countries_rank: number;
  country_list: string[];
  regions_completed: number;
  regions_rank: number;
  total_regions: number;
  region_list: string[];
  next_country_suggestion: string | null;
  next_region_suggestion: string | null;
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
