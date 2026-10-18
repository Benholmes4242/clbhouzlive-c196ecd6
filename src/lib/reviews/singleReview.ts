/** REVIEWS_STATE_2: total-course selection is independent of viewer exclusion.
 * Calibration uses the row's overall score and actual four sub-scores, never
 * a second computed score. Review-owned played months have no fallback. */
import { REVIEWS_SAMPLE } from './sampleRules';

export const isSingleReview = (totalRatings: number): boolean => totalRatings === 1;

export interface RaterContext {
  handicap: number | null;
  coursesRated: number | null;
  perfectTens: number | null;
  roundsHere: number | null;
  gender: string | null;
}

export function calibrationFacts(review: { rating: number | null; design_score: number | null; condition_score: number | null; clubhouse_score: number | null; facilities_score: number | null }, context?: RaterContext | null) {
  if (review.rating !== 10 || context?.coursesRated == null || context.coursesRated < REVIEWS_SAMPLE.middle80 || context.perfectTens == null) return null;
  return {
    coursesRated: context.coursesRated,
    perfectTens: context.perfectTens,
    everyCategory: [review.design_score, review.condition_score, review.clubhouse_score, review.facilities_score].every(score => score === 10),
  };
}

/** Accept only the review's explicit month (1–12), not any date proxy. */
export function reviewPlayedMonth(month?: number | null): string | null {
  if (month == null || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 1)));
}

export function raterHistory(rows: readonly { course_id: string; rating: number }[]) {
  const courses = new Map(rows.map(row => [row.course_id, row.rating]));
  return { coursesRated: courses.size, perfectTens: [...courses.values()].filter(rating => rating === 10).length };
}