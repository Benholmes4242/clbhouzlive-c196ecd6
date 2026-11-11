/**
 * Top 100 Community rating order (BRIEF_TOP100_COMMUNITY_RANKING §5).
 * The published set is the page's own floor (MIN_RATINGS, now two ratings);
 * remaining courses stay in official order.
 */
import { MIN_RATINGS } from './theArgument';
export function communityOrder<T>(
  courses: T[],
  ratingOf: (c: T) => { rating: number | null; ratingCount: number },
  officialRankOf: (c: T) => number | null,
  nameOf: (c: T) => string,
): { rated: Array<{ course: T; position: number }>; unrated: T[] } {
  const rated: Array<{ course: T; rating: number; count: number }> = [];
  const unrated: T[] = [];
  for (const course of courses) {
    const { rating, ratingCount } = ratingOf(course);
    // The comparison and golfers' list share one signed-off floor.
    if (rating != null && ratingCount >= MIN_RATINGS && officialRankOf(course) != null) rated.push({ course, rating, count: ratingCount });
    else unrated.push(course);
  }
  const rank = (c: T) => officialRankOf(c) ?? 999;
  rated.sort((a, b) =>
    b.rating - a.rating || rank(a.course) - rank(b.course) || nameOf(a.course).localeCompare(nameOf(b.course)),
  );
  unrated.sort((a, b) => rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b)));
  return { rated: rated.map((r, i) => ({ course: r.course, position: i + 1 })), unrated };
}
