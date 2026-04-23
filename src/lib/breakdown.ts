/**
 * Breakdown rating helpers for the personal courses tab.
 *
 * - getBreakdownSum: sum of the four breakdown scores (or null if none provided)
 * - hasAnyBreakdown / hasFullBreakdown: presence checks
 * - getTier: tier label from overall rating (EXCEPTIONAL > OUTSTANDING > ...)
 * - annotateTies: side-effect of the canonical sort, attaches `tiedAbove`
 *   metadata so cards can explain why one course beats the next.
 */

export type BreakdownScores = {
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
};

export function hasAnyBreakdown(b: BreakdownScores): boolean {
  return (
    b.design_score != null ||
    b.condition_score != null ||
    b.clubhouse_score != null ||
    b.facilities_score != null
  );
}

export function hasFullBreakdown(b: BreakdownScores): boolean {
  return (
    b.design_score != null &&
    b.condition_score != null &&
    b.clubhouse_score != null &&
    b.facilities_score != null
  );
}

/** Sum of the four breakdown scores. Null if none are provided. */
export function getBreakdownSum(b: BreakdownScores): number | null {
  if (!hasAnyBreakdown(b)) return null;
  return (
    (b.design_score ?? 0) +
    (b.condition_score ?? 0) +
    (b.clubhouse_score ?? 0) +
    (b.facilities_score ?? 0)
  );
}

export type RatingTier =
  | 'EXCEPTIONAL'
  | 'OUTSTANDING'
  | 'EXCELLENT'
  | 'VERY GOOD'
  | 'GOOD';

export function getTier(rating: number): RatingTier {
  if (rating >= 9.5) return 'EXCEPTIONAL';
  if (rating >= 9.0) return 'OUTSTANDING';
  if (rating >= 8.0) return 'EXCELLENT';
  if (rating >= 7.0) return 'VERY GOOD';
  return 'GOOD';
}

export type TiedAbove = {
  courseName: string;
  thisTotal: number | null;
  otherTotal: number | null;
};

type AnnotatableCourse = BreakdownScores & {
  rating: number;
  golf_courses: { name: string };
};

/**
 * Annotates each course with a `tiedAbove` field describing the
 * next-lower-ranked tied course (same `rating`). Attached as a
 * non-enumerable extension so the type stays compatible.
 */
export function annotateTies<T extends AnnotatableCourse>(
  sorted: T[]
): (T & { tiedAbove?: TiedAbove })[] {
  return sorted.map((course, i) => {
    const next = sorted[i + 1];
    if (!next || next.rating !== course.rating) return course;
    return {
      ...course,
      tiedAbove: {
        courseName: next.golf_courses.name,
        thisTotal: getBreakdownSum(course),
        otherTotal: getBreakdownSum(next),
      },
    };
  });
}
