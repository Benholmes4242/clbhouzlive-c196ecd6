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
