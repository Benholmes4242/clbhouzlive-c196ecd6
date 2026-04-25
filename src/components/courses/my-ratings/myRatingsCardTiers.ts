/**
 * Stratified card tiering for the My Ratings tab.
 * Determines which card variant renders for a given rating.
 *
 * Tier 1 (Exceptional, ≥9.5) → hero editorial card
 * Tier 2 (Outstanding, 9.0–9.4) → medium card
 * Tier 3 (<9.0) → compact row
 */

export type MyRatingsCardTier = 'tier1' | 'tier2' | 'tier3';

export function getCardTier(rating: number): MyRatingsCardTier {
  if (rating >= 9.5) return 'tier1';
  if (rating >= 9.0) return 'tier2';
  return 'tier3';
}

/**
 * Category-tier label used in Tier 3 inline breakdown
 * ("Design Outstanding · Cond. Very good · …").
 * Returns Title Case to read as inline prose, matching the canonical
 * ratingTier helper's tier boundaries.
 */
export function getCategoryTierLabel(score: number | null | undefined): string {
  if (score == null) return 'No score';
  if (score >= 9.5) return 'Exceptional';
  if (score >= 9.0) return 'Outstanding';
  if (score >= 8.0) return 'Excellent';
  if (score >= 7.0) return 'Very good';
  if (score >= 6.0) return 'Good';
  return 'Fair';
}

/** Section-header tier name for MyRatingsTierDivider (all-caps eyebrow). */
export function getSectionHeaderName(tier: MyRatingsCardTier): string {
  switch (tier) {
    case 'tier1':
      return 'EXCEPTIONAL';
    case 'tier2':
      return 'OUTSTANDING';
    case 'tier3':
      return 'EXCELLENT AND BELOW';
  }
}
