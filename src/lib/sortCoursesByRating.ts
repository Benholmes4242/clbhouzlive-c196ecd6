/**
 * Shared comparators for course rating sorts.
 *
 * Two tracks:
 *  - compareCoursesByRating: community-rating sorts (aggregates across reviewers)
 *  - compareOwnRatings:       a single user's own rating per course
 *
 * Both tracks deliver deterministic ordering across reloads so courses
 * tied on the primary score always render in the same relative order on
 * every surface.
 */

// =====================================================================
// Track 1 — Community rating
// =====================================================================
export type CommunityRatingRow = {
  id: string;
  name: string;
  avg_rating?: number | null;
  rating_count?: number | null;
  avg_design?: number | null;
  avg_condition?: number | null;
  avg_clubhouse?: number | null;
  avg_facilities?: number | null;
};

export function compareCoursesByRating(
  a: CommunityRatingRow,
  b: CommunityRatingRow,
  direction: 'desc' | 'asc' = 'desc'
): number {
  const mul = direction === 'desc' ? -1 : 1;

  // Primary: community rating
  const aRating = a.avg_rating ?? (direction === 'desc' ? -1 : 999);
  const bRating = b.avg_rating ?? (direction === 'desc' ? -1 : 999);
  if (aRating !== bRating) return mul * (aRating - bRating);

  // Tie-1: number of reviewers
  const aCount = a.rating_count ?? 0;
  const bCount = b.rating_count ?? 0;
  if (aCount !== bCount) return mul * (aCount - bCount);

  // Tie-2: sum of breakdowns
  const aSum =
    (a.avg_design ?? 0) +
    (a.avg_condition ?? 0) +
    (a.avg_clubhouse ?? 0) +
    (a.avg_facilities ?? 0);
  const bSum =
    (b.avg_design ?? 0) +
    (b.avg_condition ?? 0) +
    (b.avg_clubhouse ?? 0) +
    (b.avg_facilities ?? 0);
  if (aSum !== bSum) return mul * (aSum - bSum);

  // Final: stable alphabetical
  return a.name.localeCompare(b.name);
}

// =====================================================================
// Track 2 — Own rating
// =====================================================================
export type OwnRatingRow = {
  course_id: string;
  course_name?: string;
  rating?: number | null;
  design_score?: number | null;
  condition_score?: number | null;
  clubhouse_score?: number | null;
  facilities_score?: number | null;
  review_date?: string | Date | null;
};

export function compareOwnRatings(
  a: OwnRatingRow,
  b: OwnRatingRow,
  direction: 'desc' | 'asc' = 'desc'
): number {
  const mul = direction === 'desc' ? -1 : 1;

  // Primary: user's own rating
  const aRating = a.rating ?? (direction === 'desc' ? -1 : 999);
  const bRating = b.rating ?? (direction === 'desc' ? -1 : 999);
  if (aRating !== bRating) return mul * (aRating - bRating);

  // Tie-1: sum of breakdowns
  const aSum =
    (a.design_score ?? 0) +
    (a.condition_score ?? 0) +
    (a.clubhouse_score ?? 0) +
    (a.facilities_score ?? 0);
  const bSum =
    (b.design_score ?? 0) +
    (b.condition_score ?? 0) +
    (b.clubhouse_score ?? 0) +
    (b.facilities_score ?? 0);
  if (aSum !== bSum) return mul * (aSum - bSum);

  // Tie-2: review date DESC (always — recent wins regardless of primary direction)
  const aDate = a.review_date ? new Date(a.review_date).getTime() : 0;
  const bDate = b.review_date ? new Date(b.review_date).getTime() : 0;
  if (aDate !== bDate) return bDate - aDate;

  // Final: stable fallback on course_id
  return a.course_id.localeCompare(b.course_id);
}
