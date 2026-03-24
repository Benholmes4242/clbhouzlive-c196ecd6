// Podium System TypeScript Types
// Used by the Unified Podium component in Championship Mode

export type PodiumMode = 'seasonal' | 'all_time';
export type PodiumScope = 'global' | 'division' | 'friends' | 'club' | 'country' | 'handicap';

export interface PodiumEntry {
  podium_position: 1 | 2 | 3;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  narrative_text: string | null;
}

export interface SeasonalPodiumEntry extends PodiumEntry {
  courses_logged: number;
  division_id: string;
  division_name: string;
  streak_days: number;
  is_on_streak: boolean;
  rank_change_today: number;
  is_new_leader?: boolean;        // Added to podium within last 24h as #1
  is_new_podium_entry?: boolean;  // Added to podium within last 24h
  courses_to_promotion?: number;
  is_in_promotion_zone?: boolean;
}

export interface AllTimePodiumEntry extends PodiumEntry {
  all_time_courses: number;
  seasons_won: number;
  podium_finishes: number;
}

export interface PodiumProximity {
  user_position: number;
  third_place_courses: number;
  courses_to_podium: number;
  is_on_podium: boolean;
}

export interface PodiumProps {
  mode: PodiumMode;
  scope: PodiumScope;
  divisionId?: string;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

// Time filter for Championship view
export type TimeFilter = 'season' | 'all_time';
