import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCircleIds } from '@/lib/social/circle';

import type { CourseCandidateIndex } from './useCourseCandidateIndex';
import type { CourseShelfRow } from './useCourseShelves';
import { coursePlaceLine } from './placeLine';

/**
 * THE MERGED COURSES SHELVES (BRIEF_COURSES_MERGED §4).
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
 *   worth the drive ............ 28 courses
 *   new on clbhouz (90 days) ... 11 courses
 * The thresholds below were chosen against those numbers and are reported.
 */

/** A rail shows 12 tiles; below SIX it reads as a stub, so that is the fill
 *  threshold the month has to clear before the heading may say "this month". */
export const RAIL_FILL = 6;
/** §4 the rating sample floor, unchanged from the shelf it replaces. */
export const RATING_FLOOR = 2;

/** WORTH THE DRIVE, chosen from the data (see header). Rated 8.0 or better by at
 *  least two members, with five or fewer tracked rounds: 28 courses today. The
 *  round ceiling is what makes it "the few who have played them" — a course with
 *  60 tracked rounds is not a discovery, however well rated it is. */
export const WORTH_DRIVE_RATING = 8;
export const WORTH_DRIVE_MAX_ROUNDS = 5;
/** NEW ON CLBHOUZ — first rating inside this window. 30 days yields 2 courses,
 *  90 yields 11, so 90 is the shortest window that fills a rail at all. */
export const NEW_WINDOW_DAYS = 90;

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

  const month = pick((s) => s.n30, (s) => s.mean30);
  if (month.length >= RAIL_FILL) return { rows: month, window: 'month' };
  return { rows: pick((s) => s.n365, (s) => s.mean365), window: 'year' };
}

/** §4 WORTH THE DRIVE — high rating, low round count.
 *
 *  IT NEVER REPEATS THE LEAD RAIL'S TILES. The two rails share a rating floor,
 *  so on today's base the same two courses led both and the second rail read as
 *  the first one again. §4's rule is that a break must not repeat what another
 *  break said; excluding the lead's courses is that rule at the tile level. */
export function worthTheDriveShelf(index: CourseCandidateIndex, exclude: Set<string> = new Set()): CourseShelfRow[] {
  return Array.from(index.ratingsByCourse.entries())
    .filter(([courseId, stats]) => {
      if (exclude.has(courseId)) return false;
      const rounds = index.roundsByCourse.get(courseId) ?? 0;
      return stats.n >= RATING_FLOOR && stats.mean >= WORTH_DRIVE_RATING && rounds <= WORTH_DRIVE_MAX_ROUNDS;
    })
    .sort((a, b) => b[1].mean - a[1].mean || b[1].n - a[1].n || a[0].localeCompare(b[0]))
    .slice(0, SHELF_CAP)
    .map(([courseId]) => rowFor(index, courseId));
}

/** §4 NEW ON CLBHOUZ — rated here for the first time inside the window. */
export function newlyRatedShelf(index: CourseCandidateIndex): CourseShelfRow[] {
  const since = Date.now() - NEW_WINDOW_DAYS * 86_400_000;
  return Array.from(index.ratingsByCourse.entries())
    .filter(([, stats]) => new Date(stats.firstAt).getTime() >= since)
    .sort((a, b) => new Date(b[1].firstAt).getTime() - new Date(a[1].firstAt).getTime() || a[0].localeCompare(b[0]))
    .slice(0, SHELF_CAP)
    .map(([courseId]) => rowFor(index, courseId));
}

/**
 * THE CIRCLE'S COURSES (§4, §5).
 *
 * Courses the people the viewer follows have PLAYED OR RATED. The follow set is
 * the one shared definition (src/lib/social/circle.ts) — never `whs_friends`,
 * never a pending friend row.
 */
export function useCircleCourseIds(viewerId: string | undefined, enabled: boolean) {
  const query = useQuery<string[]>({
    queryKey: ['explore-magazine', 'circle-ids', viewerId ?? 'anon'],
    enabled: enabled && !!viewerId,
    staleTime: 10 * 60_000,
    queryFn: () => fetchCircleIds(viewerId as string),
  });
  return { circleIds: query.data ?? [], isFetched: enabled && viewerId ? query.isFetched : true };
}

export function circleCourseIds(index: CourseCandidateIndex, circleIds: string[]): string[] {
  if (circleIds.length === 0) return [];
  const circle = new Set(circleIds);
  const out = new Set<string>();
  for (const [courseId, players] of index.playersByCourse) {
    for (const player of players) {
      if (circle.has(player)) {
        out.add(courseId);
        break;
      }
    }
  }
  for (const review of index.reviews) {
    if (review.userId && circle.has(review.userId)) out.add(review.courseId);
  }
  return Array.from(out);
}

/** §4 WHERE YOUR CIRCLE PLAYS — most tracked rounds first. */
export function circleShelfRows(index: CourseCandidateIndex, circleIds: string[]): CourseShelfRow[] {
  return circleCourseIds(index, circleIds)
    .map((courseId) => rowFor(index, courseId))
    .sort((a, b) => b.rounds - a.rounds || (b.rating ?? 0) - (a.rating ?? 0) || a.courseId.localeCompare(b.courseId))
    .slice(0, SHELF_CAP);
}

/** §4 AROUND {county} — from the index, so it agrees with the dropdown's count.
 *  golf_courses.region EXACTLY, never the display area. */
export function countyShelfRows(index: CourseCandidateIndex, county: string | null): CourseShelfRow[] {
  if (!county) return [];
  const out: CourseShelfRow[] = [];
  for (const [courseId, course] of index.courses) {
    if (course.region === county) out.push(rowFor(index, courseId));
  }
  return out
    .sort((a, b) => b.rounds - a.rounds || (b.rating ?? 0) - (a.rating ?? 0) || a.courseId.localeCompare(b.courseId))
    .slice(0, SHELF_CAP);
}

export function useMergedCourseShelves(index: CourseCandidateIndex, county: string | null, circleIds: string[]) {
  return useMemo(
    () => {
      const lead = leadRatedShelf(index);
      const led = new Set(lead.rows.map((row) => row.courseId));
      return {
      lead,
      worthDrive: worthTheDriveShelf(index, led),
      newly: newlyRatedShelf(index),
      circle: circleShelfRows(index, circleIds),
      county: countyShelfRows(index, county),
      };
    },
    [index, county, circleIds],
  );
}
