/**
 * BRIEF_CLUB_ANALYTICS_MULTI_COURSE — the RPC contract.
 *
 * ONE RPC, COURSE-SCOPED, one round trip: `get_club_course_analytics(uuid)`.
 * SECURITY DEFINER, and it verifies the caller manages a VERIFIED Golf Club
 * whose claim resolves to that course's club. It returns NO ROWS when the
 * caller is not entitled — deliberately, so the function cannot leak whether a
 * club exists. The client therefore never reads "no rows" as "no rounds".
 *
 * AGGREGATES ONLY. There is no user id, no name, no individual round and no
 * date a named person played anywhere in this type, deliberately — a club
 * learning which of its members shot what is a different product and nobody
 * agreed to it. Adding a per-round or per-member field here is a privacy
 * change, not a UI change.
 *
 * BEN OWNS ALL SQL. If a field is wrong it is reported, not worked around.
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
  /** Mean over par on rows played off an index under 9. */
  low_to_par: number | null;
  low_rows: number;
  /** Mean over par on rows played off an index of 15 or above. */
  high_to_par: number | null;
  high_rows: number;
  /** high_to_par - low_to_par: where a higher handicapper needs the shot most. */
  spread: number | null;
  /** Stroke index the spread implies, 1 = needs the shot most. Gated. */
  si_should_be: number | null;
}

/** Seven outcomes, scorecard order, worst to best. */
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

/** ISO day of week, 1 = Monday. */
export interface ClubAnalyticsWeekday {
  dow: number;
  rounds: number;
}

export interface ClubAnalyticsYear {
  year: number;
  rounds: number;
}

/**
 * ONE MEASURED TEE, recovered from a round's summed 18 hole distances and
 * bucketed to 100 yards. THERE IS NO NAME HERE ON PURPOSE — we know the
 * yardage, not whether the club calls it white, yellow or blue.
 */
export interface ClubAnalyticsTee {
  /** 18-hole total for the set, in yards. */
  yards: number;
  /** Rounds played off this set. */
  rounds: number;
  /** Mean gross over par for a round on this set. */
  avg_to_par: number;
}

export interface ClubAnalyticsBand {
  /** e.g. "Scratch to 4.9" — the band label is the RPC's, not the client's. */
  label: string;
  rounds: number;
  /** Connected members behind those rounds. 400 rounds from 2 is not 400 golfers. */
  members: number;
}

export interface ClubAnalyticsCompetition {
  competition: number;
  social: number;
}

/** One row of the gated stroke-index recommendation. */
export interface ClubAnalyticsSiAdvice {
  hole_no: number;
  declared: number | null;
  should_be: number | null;
  spread: number | null;
}

/** The gate's own numbers, so the locked state can name the shortfall. */
export interface ClubAnalyticsSiBandRows {
  min_low_rows: number;
  min_high_rows: number;
  threshold: number;
}

/**
 * Every course the club owns. Supersedes any client-side course picking.
 * ORDERED BY rounds DESC, then name — entry [0] is the club's main course.
 *
 * `rounds` here is every measured round on that course, and it is NOT the same
 * quantity as `ClubCourseAnalytics.complete_rounds` (rounds carrying all 18
 * holes, the hole ranking's sample). Do not conflate them.
 */
export interface ClubCourseRef {
  course_id: string;
  course_name: string;
  /** Every measured round on that course. Lets a COLLAPSED block state its
   *  size without fetching that course. */
  rounds: number;
}


export interface ClubCourseAnalytics {
  course_id: string;
  course_name: string;
  /** Every course on this club — one block per entry. */
  club_courses: ClubCourseRef[];
  /** Distinct measured rounds on this course. The n every section states. */
  rounds: number;
  /** Rounds carrying all 18 holes. The hole ranking rests on THIS one. */
  complete_rounds: number;
  /** Played hole rows behind the whole payload. */
  hole_rows: number;
  /** Connected members behind those rounds — never the club's membership. */
  members: number;
  first_round: string | null;
  last_round: string | null;
  avg_gross: number | null;
  holes: ClubAnalyticsHole[];
  outcomes: ClubAnalyticsOutcomes;
  /** Total scored holes behind `outcomes` — the denominator for every share. */
  outcomes_total: number;
  months: ClubAnalyticsMonth[];
  weekdays: ClubAnalyticsWeekday[];
  years: ClubAnalyticsYear[];
  /** Measured yardages with round counts and mean over par. */
  tees: ClubAnalyticsTee[];
  /** From whs_scores.handicap_index_at_time, never today's index. */
  handicap_bands: ClubAnalyticsBand[];
  /** Rounds carrying an index at the time of play. */
  handicap_rounds: number;
  competition: ClubAnalyticsCompetition | null;
  /** NULL unless si_advice_state is 'ready'. Read the state, never this. */
  si_advice: ClubAnalyticsSiAdvice[] | null;
  si_advice_state: 'ready' | 'needs_more_players' | string;
  si_band_rows: ClubAnalyticsSiBandRows | null;
}
