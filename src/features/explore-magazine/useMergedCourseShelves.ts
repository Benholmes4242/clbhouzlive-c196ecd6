import { useMemo } from 'react';

import type { CourseCandidateIndex } from './useCourseCandidateIndex';
import type { CourseShelfRow } from './useCourseShelves';
import { coursePlaceLine } from './placeLine';
import { COURSE_RATING_FLOOR } from './courseRatingFloor';

/**
 * THE LEAD RATED SHELF (BRIEF_COURSES_MERGED §4). The Courses view and its
 * circle, worth-the-drive and new-on-clbhouz rails are deleted; only the lead
 * rail survives, on All.
 *
 * Derived from the ONE candidate index, so the rail can never show a course the
 * index says is not there, and a count can never disagree with a tile.
 *
 * THE LEAD RAIL IS THIS YEAR'S RATINGS, FOR EVERYONE: the courses with at least
 * RATING_FLOOR ratings in the last 365 days, highest mean first. The month
 * window that used to compete for the rail was retired by
 * BRIEF_COURSES_DISCOVERY §B2, so the heading always names the year.
 */

/** BRIEF_COURSES_DISCOVERY §A3 — the one sample floor. */
export const RATING_FLOOR = COURSE_RATING_FLOOR;

const SHELF_CAP = 12;

function rowFor(index: CourseCandidateIndex, courseId: string, override?: Partial<CourseShelfRow>): CourseShelfRow {
  const course = index.courses.get(courseId);
  const ratings = index.ratingsByCourse.get(courseId);
  return {
    courseId,
    name: course?.name ?? null,
    /* REGION + NATION (placeLine): the candidate index carries region raw. */
    area: coursePlaceLine({ region: course?.region, subCountry: course?.subCountry, country: course?.country }),
    imageUrl: course?.imageUrl ?? null,
    rounds: index.roundsByCourse.get(courseId) ?? 0,
    rating: ratings ? ratings.mean : null,
    ratingCount: ratings?.n ?? 0,
    rank: null,
    rankScope: null,
    ...override,
  };
}

export interface LeadRatedShelf {
  rows: CourseShelfRow[];
}

/** §4 LEAD SHELF — highest rated this year (§B2 retired the month window). */
export function leadRatedShelf(index: CourseCandidateIndex): LeadRatedShelf {
  const pick = (n: (s: { n30: number; n365: number }) => number, mean: (s: { mean30: number; mean365: number }) => number) =>
    Array.from(index.ratingsByCourse.entries())
      .filter(([, stats]) => n(stats) >= RATING_FLOOR)
      .sort((a, b) => mean(b[1]) - mean(a[1]) || n(b[1]) - n(a[1]) || a[0].localeCompare(b[0]))
      .slice(0, SHELF_CAP)
      .map(([courseId, stats]) =>
        rowFor(index, courseId, { rating: mean(stats), ratingCount: n(stats) }),
      );

  /* BRIEF_COURSES_DISCOVERY §B2 — the lead rail is "Highest rated this year"
     for everyone; the month window no longer competes for it. */
  return { rows: pick((s) => s.n365, (s) => s.mean365) };
}

export function useMergedCourseShelves(index: CourseCandidateIndex) {
  return useMemo(() => ({ lead: leadRatedShelf(index) }), [index]);
}
