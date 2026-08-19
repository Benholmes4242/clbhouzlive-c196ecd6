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

/**
 * §4 (v2) — ONE MEASURED TEE. Recovered from distance_yards: the yardage is the
 * SUM OF A ROUND'S 18 HOLE DISTANCES, which fingerprints the tee that round was
 * played off. THERE IS NO NAME HERE ON PURPOSE (§4.4) — we know the yardage, not
 * whether the club calls it white, yellow or blue.
 */
export interface ClubAnalyticsTee {
  /** 18-hole total for the set, in yards. */
  yards: number;
  /** Rounds played off this set. */
  rounds: number;
  /** Mean (actual_gross - par) per hole on this set. */
  avg_to_par: number;
}

/**
 * §4.2 — WHICH TEES THE VERDICT IS ABOUT. Never absent from the screen.
 *   'scoped'   one set carries the majority; the ranking is taken off it alone
 *   'adjusted' rounds are spread; each hole is ranked WITHIN its own set and
 *              those rankings are combined, weighted by rounds
 */
export interface ClubAnalyticsVerdictScope {
  mode: 'scoped' | 'adjusted';
  /** The set the verdict is scoped to. Null when adjusted. */
  tee_yards: number | null;
  /** Rounds behind the scoped set, or behind the whole adjustment. */
  tee_rounds: number;
  /** Share of measured rounds the scoped set carries, 0-1. */
  tee_share: number;
  /** Distinct measured yardages on this course. */
  tee_count: number;
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
  /** §4.3 — every measured yardage with its round count and mean over par. */
  tees: ClubAnalyticsTee[];
  /**
   * §4.1/4.2 — how `holes` was corrected for tee, and therefore what the
   * verdict is a verdict ABOUT. Null only from an older RPC that predates the
   * tee correction; the client then says the ranking spans every yardage
   * rather than pretending it was scoped.
   */
  verdict_scope: ClubAnalyticsVerdictScope | null;
  /** From whs_scores.handicap_index_at_time (§4.3), never today's index. */
  handicap_bands: ClubAnalyticsBand[];
  /** Rounds carrying an index at the time of play. */
  handicap_rounds: number;
}
