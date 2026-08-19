/**
 * BRIEF_CLUB_ANALYTICS_TAB — the RPC contract.
 *
 * ONE RPC, COURSE-SCOPED, one round trip: `get_club_course_analytics(uuid)`.
 * SECURITY DEFINER, and it verifies the caller manages a VERIFIED Golf Club
 * whose claim resolves to that course.
 *
 * AGGREGATES ONLY. There is no user id, no name, no individual round and no
 * date a named person played anywhere in this type, deliberately — a club
 * learning which of its members shot what is a different product and nobody
 * agreed to it. Adding a per-round or per-member field here is a privacy
 * change, not a UI change.
 *
 * Ben runs the SQL. Until the function exists the hook resolves to
 * `unavailable` and the tab says so; it never invents rows (§6.2).
 */

/** One hole, declared against measured. Ranks are 1 = hardest. */
export interface ClubAnalyticsHole {
  hole_no: number;
  par: number | null;
  /** The club's DECLARED stroke index (modal value across played rows). */
  stroke_index: number | null;
  /** Measured position, 1 = hardest by mean strokes over par. */
  measured_rank: number;
  /** Mean of (actual_gross - par) across every played row for this hole. */
  avg_to_par: number;
  /** Played hole rows behind this hole's mean. */
  rounds: number;
  yards: number | null;
}

/** §4.1 — seven outcomes, scorecard order, worst to best. */
export interface ClubAnalyticsOutcomes {
  double_plus: number;
  bogey: number;
  par: number;
  birdie: number;
  eagle: number;
  albatross: number;
  ace: number;
}

export interface ClubAnalyticsMonth {
  /** 1-12. */
  month: number;
  rounds: number;
}

export interface ClubAnalyticsBand {
  /** e.g. "Scratch to 4.9" — the band label is the RPC's, not the client's. */
  label: string;
  rounds: number;
}

export interface ClubCourseAnalytics {
  course_id: string;
  course_name: string;
  /** Distinct measured rounds on this course. The n every section states. */
  rounds: number;
  /** Played hole rows behind the whole payload. */
  hole_rows: number;
  holes: ClubAnalyticsHole[];
  outcomes: ClubAnalyticsOutcomes;
  /** Total scored holes behind `outcomes` — the denominator for every share. */
  outcomes_total: number;
  months: ClubAnalyticsMonth[];
  /** From whs_scores.handicap_index_at_time (§4.3), never today's index. */
  handicap_bands: ClubAnalyticsBand[];
  /** Rounds carrying an index at the time of play. */
  handicap_rounds: number;
}
