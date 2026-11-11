/**
 * Top 100 Community rating order (BRIEF_TOP100_COMMUNITY_RANKING §5).
 * Pure: the comparison's qualifying set by average; all others in official order.
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
    // Nov 11 signed-off rule: published rank and three ratings qualify, matching compareRows.
    if (rating != null && ratingCount >= 3 && officialRankOf(course) != null) rated.push({ course, rating, count: ratingCount });
    else unrated.push(course);
  }
  const rank = (c: T) => officialRankOf(c) ?? 999;
  rated.sort((a, b) =>
    b.rating - a.rating || rank(a.course) - rank(b.course) || nameOf(a.course).localeCompare(nameOf(b.course)),
  );
  unrated.sort((a, b) => rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b)));
  return { rated: rated.map((r, i) => ({ course: r.course, position: i + 1 })), unrated };
}
