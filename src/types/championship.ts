// Championship Mode TypeScript Types
// Based on Phase 1 RPC return types

export type DivisionSlug = 
  | 'rookie'
  | 'fairway'
  | 'founders'
  | 'heritage'
  | 'century'
  | 'elite'
  | 'legendary'
  | 'grandslam';

export type ZoneType = 'promotion' | 'safe' | 'relegation' | null;

export interface ChampionshipSeason {
  id: string;
  name: string;
  season_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  days_remaining: number;
  /** Editorial: prize copy shown in the dark sponsor card (e.g. "£750 voucher"). */
  prize_description?: string | null;
  /** Editorial: sponsor display name shown beside the prize. */
  sponsor_name?: string | null;
  /** Editorial: sponsor link target (opens externally). */
  sponsor_url?: string | null;
}

export interface DivisionConfig {
  id: string;
  slug: DivisionSlug;
  name: string;
  tier_order: number;
  min_courses: number;
  max_courses: number | null;
  color_hex: string;
  icon_key: string;
  promotion_zone_top_n: number;
  relegation_zone_bottom_n: number;
}

export interface ChampionshipLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  home_club: string | null;
  courses_this_season: number;
  current_rank: number;
  rank_movement: number; // positive = climbed, negative = dropped
  movement_period: 'daily' | 'weekly';
  division_slug: DivisionSlug;
  division_name: string;
  division_color: string;
  zone: ZoneType;
  streak_current: number;
  is_current_user: boolean;
}

export interface ChampionshipLeaderboardResponse {
  entries: ChampionshipLeaderboardEntry[];
  total_count: number;
  current_user_entry: ChampionshipLeaderboardEntry | null;
  season: ChampionshipSeason | null;
}

export interface UserChampionshipStatus {
  user_id: string;
  season_id: string;
  courses_this_season: number;
  current_rank: number;
  rank_movement_daily: number;
  rank_movement_weekly: number;
  division_slug: DivisionSlug;
  division_name: string;
  division_color: string;
  zone: ZoneType;
  courses_to_next_division: number | null;
  next_division_name: string | null;
  days_remaining: number;
  streak_current: number;
  streak_best: number;
  best_rank_this_season: number;
  closest_rival: {
    user_id: string;
    display_name: string;
    gap: number; // positive = they're ahead
  } | null;
}

export interface UserRival {
  rival_user_id: string;
  display_name: string;
  avatar_url: string | null;
  courses_this_season: number;
  current_rank: number;
  gap: number; // positive = they're ahead, negative = we're ahead
  times_overtaken: number;
  times_been_overtaken: number;
  relationship: 'above' | 'below';
}

export interface SeasonBadge {
  id: string;
  user_id: string;
  season_id: string;
  badge_type: 'division_finish' | 'promotion' | 'streak' | 'top_10' | 'winner';
  badge_key: string;
  earned_at: string;
  metadata: Record<string, unknown>;
}

// Filter/UI State Types
export type ChampionshipArenaMode = 'global' | 'division' | 'friends' | 'club' | 'country' | 'handicap';

export interface ChampionshipFilters {
  arenaMode: ChampionshipArenaMode;
  divisionFilter: DivisionSlug | 'all';
  showRivals: boolean;
}

// Movement indicator display helpers
export type MovementDirection = 'up' | 'down' | 'stable';

export function getMovementDirection(movement: number): MovementDirection {
  if (movement > 0) return 'up';
  if (movement < 0) return 'down';
  return 'stable';
}

export function getMovementLabel(movement: number): string {
  if (movement > 0) return `↑${movement}`;
  if (movement < 0) return `↓${Math.abs(movement)}`;
  return '—';
}

// Division tier helpers
export const DIVISION_ORDER: DivisionSlug[] = [
  'rookie',
  'fairway',
  'founders',
  'heritage',
  'century',
  'elite',
  'legendary',
  'grandslam',
];

export function getDivisionIndex(slug: DivisionSlug): number {
  return DIVISION_ORDER.indexOf(slug);
}

export function isHigherDivision(a: DivisionSlug, b: DivisionSlug): boolean {
  return getDivisionIndex(a) > getDivisionIndex(b);
}

// Two-letter abbreviation for division (used in All-Time standings DIV column)
const DIVISION_ABBREVIATIONS: Record<string, string> = {
  rookie: 'RK',
  fairway: 'FW',
  founders: 'FD',
  heritage: 'HG',
  century: 'CN',
  elite: 'EL',
  legendary: 'LG',
  grandslam: 'GS',
};

export function abbreviateDivision(slug: string | null | undefined): string {
  if (!slug) return '—';
  const base = slug.toLowerCase().replace(/-?club$/, '').replace(/[-_\s]/g, '');
  return DIVISION_ABBREVIATIONS[base] ?? base.slice(0, 2).toUpperCase();
}
