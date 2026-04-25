/**
 * Stratified card tiering for the My Ratings / Courses Played tab.
 * Determines which card variant renders for a given rating.
 *
 * Full hero    (≥9.5)  → full-bleed editorial card
 * Compact hero (9.0-9.4) → medium hero card
 * Compact      (<9.0)  → small ruled row
 *
 * Internal hero-tier IDs are intentionally decoupled from user-facing
 * tier vocabulary: under the 5-tier taxonomy (April 2026), all ratings
 * ≥9.0 surface as "Exceptional". The two hero layouts preserve a silent
 * visual reward for the absolute best courses without pretending to be
 * separate tier labels.
 */

export type MyRatingsHeroTier = 'fullHero' | 'compactHero' | null;

/**
 * Returns 'fullHero' (≥9.5), 'compactHero' (9.0-9.4), or null (compact).
 * Bucketing boundaries preserved from the previous design — only the
 * value names changed (Phase C of the 5-tier taxonomy redesign).
 */
export function getHeroTier(
  rating: number | null | undefined,
): MyRatingsHeroTier {
  if (rating == null) return null;
  if (rating >= 9.5) return 'fullHero';
  if (rating >= 9.0) return 'compactHero';
  return null;
}

/**
 * Tier name used in the byline metadata row on hero cards
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
 * Category tier label used in the compact row inline breakdown.
 * Returns Title Case to sit inline with sentence text.
 */
export function getCategoryTierLabel(
  score: number | null | undefined,
): string {
  if (score == null) return 'No score';
  if (score >= 9.0) return 'Exceptional';
  if (score >= 7.5) return 'Excellent';
  if (score >= 6.0) return 'Good';
  if (score >= 4.0) return 'Fair';
  return 'Poor';
}

/**
 * Coarse tier bucket used to group cards under section dividers.
 * Two buckets reflect the 5-tier taxonomy honestly — one Exceptional
 * section, one Excellent-and-below section. The card-layout split
 * within "top" (full hero vs compact hero) is a silent visual reward.
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
