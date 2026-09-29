/** No course prints an aggregate below this many ratings. A 10.0 from one
 *  person is an opinion, not a verdict (BRIEF_COURSES_DISCOVERY §A3).
 *
 *  THE RANKER AGREES: get_explore_stream ramps the courses rating term to full
 *  weight at 3 ratings. If this ever changes, it changes in both places. */
export const COURSE_RATING_FLOOR = 3;

/** True when a rating may be printed as a figure. */
export function ratingPrintable(rating: number | null | undefined, count: number | null | undefined): rating is number {
  return rating != null && (count ?? 0) >= COURSE_RATING_FLOOR;
}
