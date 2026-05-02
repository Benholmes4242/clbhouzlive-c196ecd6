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

export interface WhsFriendMatch {
  friend_row_id: string;
  owner_connection_id: string;
  owner_user_id: string;
  friend_passport_id: number;
  friend_name: string;
  friend_home_club: string | null;
  friend_handicap_index: number | null;
  friend_thumbnail_url: string | null;
  friend_privacy_mode: string | null;
  last_round_played_at: string | null;
  last_round_course_name: string | null;
  last_round_adjusted_gross: number | null;
  friend_user_id: string | null;
  friend_connection_id: string | null;
  is_clbhouz_user: boolean;
}

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

export interface Achievement {
  id: string;
  type:
    | 'career_low'
    | 'first_sub_n'
    | 'counter_streak'
    | 'sub_handicap_streak'
    | 'course_conquered'
    | 'anniversary'
    | 'milestone';
  title: string;
  subtitle: string;
  achieved_at: string;
  icon_name: string;
  highlight: boolean;
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

export interface WhsLastRoundDetail {
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
