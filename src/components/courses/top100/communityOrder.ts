/**
 * Top 100 Community rating order (BRIEF_TOP100_COMMUNITY_RANKING §5).
 * Pure: rated courses by members' average, unrated courses in official order.
 */
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
    // One rating qualifies, by founder decision; COURSE_RATING_FLOOR deliberately not used.
    if (rating != null && ratingCount >= 1) rated.push({ course, rating, count: ratingCount });
    else unrated.push(course);
  }
  const rank = (c: T) => officialRankOf(c) ?? 999;
  rated.sort((a, b) =>
    b.rating - a.rating || b.count - a.count || rank(a.course) - rank(b.course) || nameOf(a.course).localeCompare(nameOf(b.course)),
  );
  unrated.sort((a, b) => rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b)));
  return { rated: rated.map((r, i) => ({ course: r.course, position: i + 1 })), unrated };
}
