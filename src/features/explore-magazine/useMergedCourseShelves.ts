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
 * Every rail here is derived from the ONE candidate index, so a rail can never
 * show a course the dropdown says is not there, and a count can never disagree
 * with a tile. Rails that already existed (Around {county}, The world's best, On
 * your list) are REUSED from useCourseShelves — not rebuilt here.
 *
 * THE LEAD RAIL WIDENS AND SAYS SO (§4). "Highest rated this month" needs enough
 * courses to fill the rail; below RAIL_FILL it widens to the year AND THE
 * HEADING CHANGES WITH IT. A month's heading over a year's data is a small lie.
 *
 * MEASURED SUPPLY, production base, at build time:
 *   month, floor 2 ratings ..... 1 course     -> the rail widens for everyone
 *   year,  floor 2 ratings ..... 43 courses   -> the rail fills, heading "year"
 * The thresholds below were chosen against those numbers and are reported.
 */

/** A rail shows 12 tiles; below SIX it reads as a stub, so that is the fill
 *  threshold the month has to clear before the heading may say "this month". */
export const RAIL_FILL = 6;
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
  /** WHICH WINDOW THE HEADING MUST NAME. */
  window: 'month' | 'year';
}

/** §4 LEAD SHELF — highest rated this month, widening to the year. */
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
  return { rows: pick((s) => s.n365, (s) => s.mean365), window: 'year' };
}

export function useMergedCourseShelves(index: CourseCandidateIndex) {
  return useMemo(() => ({ lead: leadRatedShelf(index) }), [index]);
}
