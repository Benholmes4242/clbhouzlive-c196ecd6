/**
 * Tier helpers for the My Ratings / Course History list.
 *
 * Naming preserved as `myRatingsHeroTiers.ts` to limit churn — but
 * the hero-tier concept (full vs compact hero) was retired with the
 * DossierCard consolidation (April 2026). All rated courses render
 * as a single primitive; only the bucket dividers and the byline
 * tier name still consume from this file.
 */

export interface RatedCourseData {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_image: string | null;
  is_top100: boolean;
  global_rank: number | null;
  last_played_at: string | null;
  rating_value: number;
  rating_id: string | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review: string | null;
  review_date: string | null;
}

/**
 * Tier name used in the byline metadata row on cards
 * and as section header labels. Aligned to the 5-tier taxonomy.
 */
export function getTierName(rating: number | null | undefined): string {
  if (rating == null) return 'UNRATED';
  if (rating >= 9.0) return 'EXCEPTIONAL';
  if (rating >= 7.5) return 'EXCELLENT';
  if (rating >= 6.0) return 'GOOD';
  if (rating >= 4.0) return 'FAIR';
  return 'POOR';
}

/**
 * Coarse tier bucket used to group cards under section dividers.
 * Two buckets reflect the 5-tier taxonomy honestly — one Exceptional
 * section, one Excellent-and-below section.
 */
export type MyRatingsBucket = 'top' | 'rest';

export function getBucket(rating: number): MyRatingsBucket {
  if (rating >= 9.0) return 'top';
  return 'rest';
}

export function getBucketLabel(bucket: MyRatingsBucket): string {
  if (bucket === 'top') return 'EXCEPTIONAL';
  return 'EXCELLENT AND BELOW';
}
