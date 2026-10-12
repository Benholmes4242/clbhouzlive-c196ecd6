/** RANKING ELIGIBILITY: no course is ORDERED by its aggregate below this many
 *  ratings. A 10.0 from one person is an opinion, not a verdict
 *  (BRIEF_COURSES_DISCOVERY §A3).
 *
 *  THE RULE (BRIEF_COURSE_HERO_BAND V.3): a rating may be SHOWN without a floor
 *  only where its sample size is shown beside it. Where the count is not
 *  visible, the floor applies. The floor always applies to ORDERING.
 *
 *  THE RANKER AGREES: get_explore_stream ramps the courses rating term to full
 *  weight at 3 ratings. If this ever changes, it changes in both places. */
export const COURSE_RATING_FLOOR = 3;

/** True when a rating exists. Use ONLY where the review count sits beside it. */
export function ratingDisplayable(rating: number | null | undefined): rating is number {
  return rating != null;
}

/** True when a rating has enough ratings to rank by, or to print with no count beside it. */
export function ratingRankable(rating: number | null | undefined, count: number | null | undefined): rating is number {
  return rating != null && (count ?? 0) >= COURSE_RATING_FLOOR;
}
