export interface WhsConnection {
  id: string;
  passport_id: number;
  membership_number: string;
  last_synced_at: string | null;
  last_sync_status: string | null;
  initial_sync_complete: boolean;
  created_at: string;
}

export interface WhsHandicapTrend {
  current: number | null;
  delta: number | null;
  hasHistory: boolean;
}

export interface WhsCourseRef {
  name: string;
  country_name: string | null;
}

export interface WhsScore {
  id: string;
  play_date: string;
  adjusted_gross: number | null;
  stableford_points: number | null;
  handicap_differential: number | null;
  course_rating: number | null;
  slope_rating: number | null;
  marker_name: string | null;
  is_counter: boolean;
  course: WhsCourseRef | null;
}

export interface WhsLastRound extends WhsScore {
  course_thumbnail_image: string | null;
  /** Handicap index after this round was applied. */
  handicap_index_at_time: number | null;
  /**
   * Difference between this round's index and the previous round's index.
   * Negative = handicap dropped (improvement). Positive = went up.
   * 0 = unchanged. null = no previous round.
   */
  handicap_delta: number | null;
}

export interface WhsCounterScore {
  id: string;
  play_date: string;
  adjusted_gross: number | null;
  handicap_differential: number | null;
  course: WhsCourseRef | null;
}

export interface ConnectWhsSuccess {
  ok: true;
  name?: string;
  handicap_index?: number;
  home_club?: string | null;
  scores_imported?: number;
  friends_imported?: number;
}

export interface ConnectWhsError {
  ok: false;
  error_code?: string;
  message?: string;
}

export type ConnectWhsResponse = ConnectWhsSuccess | ConnectWhsError;

export interface SyncWhsResponse {
  ok: boolean;
  error?: string;
  message?: string;
  handicap_changed?: boolean;
  handicap_index?: number;
}

// ─── Phase 6b additions ────────────────────────────────────────────────

export interface WhsInviteStatus {
  id: string;
  inviter_user_id: string;
  invitee_passport_id: number;
  invitee_name: string;
  invitee_home_club: string | null;
  invite_code: string;
  share_method: string | null;
  sent_at: string;
  redeemed_at: string | null;
  redeemed_by_user_id: string | null;
  status: 'pending' | 'redeemed' | 'expired';
  redeemer_connection_id: string | null;
}

export interface CreateInviteResponse {
  ok: boolean;
  invite_id?: string;
  invite_code?: string;
  share_url?: string;
  share_message?: string;
  invitee_name?: string;
  error_code?: string;
  message?: string;
}

export interface HandicapPoint {
  observed_at: string;
  handicap_index: number;
}

export type AchievementType =
  // Existing (some refined to use tiered progression):
  | 'career_low'
  | 'sub_handicap_streak'
  | 'counter_streak'
  | 'milestone'              // handicap thresholds: 10, 5, 0, -2
  // New tiered:
  | 'round_milestones'       // 10/25/50/100/250/500
  | 'counter_milestones'     // 10/25/50/100
  | 'years_active'           // 1y/2y/5y/10y (replaces anniversary)
  | 'big_drop'               // 0.5/1.0/2.0 stroke cut, 30 days
  | 'course_conquered'       // 5/10/25/50/100 courses (now tiered)
  // New one-shot:
  | 'first_counted_round'
  | 'first_counter'
  | 'connected_eg'
  | 'personal_best_round'
  | 'home_club_master'
  | 'course_beater'
  | 'steady_performer'
  | 'played_to_handicap'
  // Deprecated, retained for back-compat:
  | 'first_sub_n'
  | 'anniversary'
  // Sprint 3 — hole-by-hole:
  | 'hole_in_one'
  | 'eagles'
  | 'sub_par_round'
  // Sprint 3 — social:
  | 'first_friend'
  | 'played_with_friend'
  | 'out_played_friend'
  | 'rivalry_winner'
  | 'travel_golfer'
  // Sprint 3 — course tiered:
  | 'top_100_conqueror'
  // Sprint 3 — meta:
  | 'trophy_hunter';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  subtitle: string;
  /** ISO date when achieved. Null for locked trophies. */
  achieved_at: string | null;
  icon_name: string;
  /** True for highlight visual treatment (gradient + crown). */
  highlight: boolean;
  /** True if user has earned this. False = locked. */
  earned: boolean;
  /** For tiered trophies — current tier reached (1-indexed). 0 if not yet earned. */
  tier?: number;
  /** Total tiers possible for this trophy. */
  totalTiers?: number;
  /** Progress toward next tier or first earn. 0-1. */
  progress?: number;
  /** Subtitle text for progress display (e.g. "50 / 100 rounds"). */
  progressLabel?: string;
  /** Category for grouping in the bottom sheet. */
  category: 'round_quality' | 'volume' | 'improvement' | 'course' | 'social' | 'milestone';
}

export interface CourseForm {
  course_id: string;
  course_name: string;
  rounds_played: number;
  avg_differential: number;
  expected_differential: number;
  delta: number;
}

// ─── Hole-level detail ──────────────────────────────────────────────────
// ─── Phase 2: Friend course bests (PR rosette) ──────────────────────────
export interface WhsFriendCourseBest {
  /** The friend's connection_id (NOT the owner's). */
  friend_connection_id: string;
  /** The course id from whs_courses. */
  course_id: string;
  /** Their best adjusted_gross at this course in the last 90 days. */
  best_gross: number;
  /** The score_id of that best round. */
  best_score_id: string;
  /** When the best was achieved. */
  best_play_date: string;
}

// ─── Phase 2: Recently played enriched with course image ────────────────
export interface WhsFriendActivityWithImage {
  friend_row_id: string;
  friend_passport_id: number;
  friend_name: string;
  friend_thumbnail_url: string | null;
  friend_user_id: string | null;
  friend_connection_id: string | null;
  is_clbhouz_user: boolean;
  last_round_played_at: string | null;
  last_round_course_name: string | null;
  last_round_adjusted_gross: number | null;
  last_round_stableford: number | null;
  last_round_differential: number | null;
  last_round_score_id: string | null;
  course_thumbnail_image: string | null;
  /** True when last_round equals the friend's 90-day best for that course. */
  is_course_best: boolean;
  /** Friend's current handicap index (from whs_friend_matches). */
  friend_handicap_index: number | null;
  /** Whether the round counts toward the friend's handicap. */
  is_counter: boolean;
  /** Friend's handicap index at the time the round was posted. */
  handicap_index_at_time: number | null;
}

// ─── Hole-level detail ──────────────────────────────────────────────────
export interface WhsScoreHole {
  hole_no: number;
  par: number;
  actual_gross: number | null;
  adjusted_gross: number | null;
  distance_yards: number | null;
  stroke_index: number | null;
  played: boolean;
  hole_alias: string | null;
}

// ─── Phase 2.1: Time-scoped friend leaderboards ─────────────────────────
export interface WhsFriendWindowRanking {
  owner_user_id: string;
  friend_row_id: string;
  friend_connection_id: string;
  this_year_avg_diff: number | null;
  this_year_rounds: number;
  this_month_avg_diff: number | null;
  this_month_rounds: number;
  last_8_avg_diff: number | null;
  last_8_rounds: number;
}

export interface WhsScoreWithIndex extends WhsScore {
  /** Handicap index after this round was applied. Null if not yet computed. */
  handicap_index_at_time: number | null;
}

/** @deprecated Use WhsScoreWithIndex */
export type WhsRecentRound = WhsScoreWithIndex;

/** @deprecated Use WhsRoundDetail */
export type WhsLastRoundDetail = WhsRoundDetail;

export interface WhsRoundDetail {
  id: string;
  play_date: string;
  adjusted_gross: number | null;
  actual_gross: number | null;
  stableford_points: number | null;
  handicap_differential: number | null;
  handicap_index_at_time: number | null;
  course_handicap: number | null;
  course_rating: number | null;
  slope_rating: number | null;
  pcc: number | null;
  marker_name: string | null;
  is_counter: boolean;
  is_competition_score: boolean;
  is_nine_hole: boolean;
  total_holes: number;
  hole_by_hole_fetched: boolean;
  permalink_url: string | null;
  course: WhsCourseRef | null;
  course_header_image: string | null;
  course_thumbnail_image: string | null;
  holes: WhsScoreHole[] | null;
}

// ─── Phase 0 (Friends Tab Redesign): Featured friend round + rivalries ──

export interface FriendFeaturedRound {
  user_id: string;
  score_id: string;
  computed_at: string;
  algorithm_version: string;
  scoring_breakdown: {
    recency: number;
    rivalry: number;
    quality: number;
    novelty: number;
    is_pb: boolean;
    total: number;
    window_days: number;
  } | null;
  is_personal_best: boolean;
  freshness_window_days: number;
  expires_at: string;
}

export interface FriendFeaturedRoundHydrated extends FriendFeaturedRound {
  friend_name: string;
  friend_thumbnail_url: string | null;
  friend_handicap_index: number | null;
  friend_user_id: string | null;
  friend_connection_id: string | null;
  is_clbhouz_user: boolean;
  play_date: string;
  course_id: string | null;
  course_name: string | null;
  course_thumbnail_image: string | null;
  adjusted_gross: number;
  handicap_differential: number | null;
  stableford_points: number | null;
  is_counter: boolean;
  handicap_index_at_time: number | null;
}

export type RivalrySlotKind = 'regular' | 'chasing' | 'chased_by' | 'pinned';

export interface FriendRivalry {
  user_id: string;
  slot_index: number;
  slot_kind: RivalrySlotKind;
  rival_user_id: string | null;
  rival_friend_row_id: string | null;
  rival_handicap: number | null;
  rival_trend_delta: number | null;
  shared_rounds_count: number;
  shared_rounds_last_90d: number;
  stableford_record: { wins: number; losses: number; ties: number };
  gross_record: { wins: number; losses: number; ties: number };
  shared_round_results: Array<{
    play_date: string;
    course_id: string;
    course_name: string;
    user_stableford: number;
    rival_stableford: number;
    user_gross: number;
    rival_gross: number;
    stableford_outcome: 'W' | 'L' | 'T';
    gross_outcome: 'W' | 'L' | 'T';
  }>;
  computed_at: string;
}

export interface FriendRivalryHydrated extends FriendRivalry {
  rival_name: string | null;
  rival_thumbnail_url: string | null;
  rival_is_clbhouz_user: boolean;
  rival_friend_connection_id: string | null;
}

export interface UserRivalOverride {
  user_id: string;
  slot_index: number;
  rival_user_id: string | null;
  rival_friend_row_id: string | null;
  pinned_at: string;
}

export interface FriendLeaderboardEntry {
  is_self: boolean;
  friend_user_id: string | null;
  friend_connection_id: string | null;
  /** Passport ID. Now ALWAYS populated, including for the self row. */
  friend_passport_id: number | null;
  /** Friend match row ID. Used as the rival identifier for non-Clbhouz friends. NULL for self row. */
  friend_row_id: string | null;
  friend_name: string;
  friend_thumbnail_url: string | null;
  /** Now nullable — friends without a posted handicap get NULL. */
  friend_handicap_index: number | null;
  /** England Golf home club name. NULL for self row. */
  friend_home_club: string | null;
  last_round_played_at: string | null;
  last_round_course_name: string | null;
  is_clbhouz_user: boolean;
  /** Handicap 30 days ago. NULL when no snapshot from 30+ days ago exists. */
  handicap_30d_ago: number | null;
  /** Current minus 30d_ago. Negative = improvement. NULL if either side is NULL. */
  handicap_30d_delta: number | null;
}

// ─── Phase 2B: Where You Stand peer comparison ────────────────────────────

export type HandicapBucket =
  | 'sub_zero' | '0_4' | '5_9' | '10_14' | '15_19' | '20_24' | 'over_25';

export interface HandicapPercentileBucket {
  bucket: HandicapBucket;
  pct: number;
  is_user_bucket: boolean;
}

export type HandicapPercentileUnavailableReason =
  | 'unauthenticated'
  | 'missing_handicap'
  | 'opted_out'
  | 'cohort_unavailable';

export type HandicapPercentileResult =
  | {
      available: false;
      reason: HandicapPercentileUnavailableReason;
    }
  | {
      available: true;
      percentile_top: number;
      user_bucket: HandicapBucket;
      user_handicap: number;
      cohort_size: number;
      buckets: HandicapPercentileBucket[];
    };

