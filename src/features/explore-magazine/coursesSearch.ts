import type { CourseCandidateIndex } from './useCourseCandidateIndex';

/**
 * SEARCH OVER THE MERGED COURSES VIEW (BRIEF_COURSES_MERGED §6).
 *
 * FOUR THINGS, as the brief asks: course names, region and country names,
 * reviewer names, and THE WORDS INSIDE REVIEWS.
 *
 * IT SEARCHES THE WHOLE CANDIDATE UNIVERSE, NOT A PAGE. The index this reads is
 * every rated course, every course with a tracked round and every review with
 * prose — see useCourseCandidateIndex. So the result set is complete for
 * anything §8 allows to be a card.
 *
 * THE LIMIT, STATED: a course with no round and no rating is not in the index
 * because §8 forbids it from being a card. docs/sql/explore_courses_merged_search.sql
 * (UNAPPLIED) proposes the server-side ranked path that would let a
 * non-candidate course be surfaced deliberately, with its own treatment.
 */

export interface CourseSearchResult {
  courseIds: string[];
  /** Reviews matched on their own words or their author's name. */
  reviewIds: string[];
  matched: { name: number; place: number; reviewer: number; words: number };
}

export const EMPTY_SEARCH: CourseSearchResult = {
  courseIds: [],
  reviewIds: [],
  matched: { name: 0, place: 0, reviewer: 0, words: 0 },
};

function norm(value: string | null | undefined): string {
  return (value ?? '').toLowerCase();
}

export function searchCourses(index: CourseCandidateIndex, rawQuery: string): CourseSearchResult {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return EMPTY_SEARCH;

  const courseIds = new Set<string>();
  const reviewIds = new Set<string>();
  const matched = { name: 0, place: 0, reviewer: 0, words: 0 };

  for (const [courseId, course] of index.courses) {
    if (norm(course.name).includes(q)) {
      courseIds.add(courseId);
      matched.name += 1;
      continue;
    }
    if (
      norm(course.region).includes(q) ||
      norm(course.subCountry).includes(q) ||
      norm(course.country).includes(q)
    ) {
      courseIds.add(courseId);
      matched.place += 1;
    }
  }

  for (const review of index.reviews) {
    const reviewer = review.userId ? index.reviewersById.get(review.userId) : undefined;
    const byName = norm(reviewer?.name).includes(q) || norm(reviewer?.username).includes(q);
    const byWords = review.review.toLowerCase().includes(q);
    if (!byName && !byWords) continue;
    reviewIds.add(review.id);
    courseIds.add(review.courseId);
    if (byName) matched.reviewer += 1;
    if (byWords) matched.words += 1;
  }

  return { courseIds: Array.from(courseIds), reviewIds: Array.from(reviewIds), matched };
}

export interface PlaceNode {
  country: string;
  count: number;
  regions: Array<{ region: string; count: number }>;
}

/**
 * THE REGION DROPDOWN'S OPTIONS (§7).
 *
 * GROUPED BY COUNTRY with regions nested, A COUNT ON EVERY ROW, and ONLY PLACES
 * WITH CONTENT.
 *
 * "HAS CONTENT" IS A PARAMETER, NOT A FORK (BRIEF_EXPLORE_SECOND_PASS §3). The
 * two views render different material, so they qualify a place differently, but
 * ONE tree builder serves both:
 *   - 'roundsOrRatings' (the default, the merged Courses view): a place appears
 *     when it holds a course with a tracked round OR a rating, which is exactly
 *     what that view can render.
 *   - 'rounds' (Scores): Scores is rounds, so a place with ratings and no
 *     tracked round would offer an empty page and does not appear. This is
 *     STRICTLY A SUBSET of the Courses rule — never a wider one.
 *
 * THE COUNTRY IS golf_courses.sub_country — the nation a member names (Scotland,
 * England), not the `country` column's continent-level value.
 */
export type PlaceContentRule = 'roundsOrRatings' | 'rounds';

function qualifies(index: CourseCandidateIndex, courseId: string, rule: PlaceContentRule): boolean {
  if (rule === 'rounds') return (index.roundsByCourse.get(courseId) ?? 0) > 0;
  return true;
}

export function placeTree(index: CourseCandidateIndex, rule: PlaceContentRule = 'roundsOrRatings'): PlaceNode[] {
  const byCountry = new Map<string, Map<string, number>>();
  const countryTotals = new Map<string, number>();
  for (const course of index.courses.values()) {
    if (!qualifies(index, course.id, rule)) continue;
    const country = course.subCountry ?? course.country;
    if (!country) continue;
    countryTotals.set(country, (countryTotals.get(country) ?? 0) + 1);
    const regions = byCountry.get(country) ?? new Map<string, number>();
    if (course.region) regions.set(course.region, (regions.get(course.region) ?? 0) + 1);
    byCountry.set(country, regions);
  }
  return Array.from(byCountry.entries())
    .map(([country, regions]) => ({
      country,
      count: countryTotals.get(country) ?? 0,
      regions: Array.from(regions.entries())
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region)),
    }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}


export interface PlaceChoice {
  country: string;
  region: string | null;
}

/** The candidate courses inside a chosen place. Country-only means every region
 *  in it — §7, the country is selectable in its own right. */
export function placeCourseIds(index: CourseCandidateIndex, choice: PlaceChoice): string[] {
  const out: string[] = [];
  for (const [courseId, course] of index.courses) {
    const country = course.subCountry ?? course.country;
    if (country !== choice.country) continue;
    if (choice.region && course.region !== choice.region) continue;
    out.push(courseId);
  }
  return out;
}
