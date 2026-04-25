/**
 * Stratified card tiering for the My Ratings / Courses Played tab.
 * Determines which card variant renders for a given rating.
 *
 * Hero  (≥9.0)  → full-bleed editorial card
 * Compact (<9.0) → small ruled row
 */

export type MyRatingsHeroTier = 'exceptional' | 'outstanding' | null;

/** Returns 'exceptional' (9.5+), 'outstanding' (9.0-9.4), or null (compact). */
export function getHeroTier(
  rating: number | null | undefined,
): MyRatingsHeroTier {
  if (rating == null) return null;
  if (rating >= 9.5) return 'exceptional';
  if (rating >= 9.0) return 'outstanding';
  return null;
}

/**
 * Tier name used in the byline metadata row on hero cards
 * and as section header labels.
 */
export function getTierName(rating: number | null | undefined): string {
  if (rating == null) return 'UNRATED';
  if (rating >= 9.5) return 'EXCEPTIONAL';
  if (rating >= 9.0) return 'OUTSTANDING';
  if (rating >= 8.0) return 'EXCELLENT';
  if (rating >= 7.0) return 'VERY GOOD';
  return 'GOOD';
}

/**
 * Category tier label used in the compact row inline breakdown.
 * Returns Title Case to sit inline with sentence text.
 */
export function getCategoryTierLabel(
  score: number | null | undefined,
): string {
  if (score == null) return 'No score';
  if (score >= 9.5) return 'Exceptional';
  if (score >= 9.0) return 'Outstanding';
  if (score >= 8.0) return 'Excellent';
  if (score >= 7.0) return 'Very good';
  if (score >= 6.0) return 'Good';
  return 'Fair';
}

/** Coarse tier bucket used to group cards under section dividers. */
export type MyRatingsBucket = 'exceptional' | 'outstanding' | 'excellent';

export function getBucket(rating: number): MyRatingsBucket {
  if (rating >= 9.5) return 'exceptional';
  if (rating >= 9.0) return 'outstanding';
  return 'excellent';
}

export function getBucketLabel(bucket: MyRatingsBucket): string {
  if (bucket === 'exceptional') return 'EXCEPTIONAL';
  if (bucket === 'outstanding') return 'OUTSTANDING';
  return 'EXCELLENT AND BELOW';
}
