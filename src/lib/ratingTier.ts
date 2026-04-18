/**
 * Rating tier taxonomy for Clbhouz reviews.
 * Mirrors the logic previously duplicated across courseFeedAdapter,
 * profileFeedAdapter, and unifiedMediaItemAdapter.
 */

export type RatingTier = 'OUTSTANDING' | 'EXCELLENT' | 'VERY GOOD' | 'GOOD' | 'FAIR';

export function getRatingTier(rating: number | null | undefined): RatingTier {
  if (rating == null) return 'FAIR';
  if (rating >= 9) return 'OUTSTANDING';
  if (rating >= 8) return 'EXCELLENT';
  if (rating >= 7) return 'VERY GOOD';
  if (rating >= 6) return 'GOOD';
  return 'FAIR';
}

/**
 * Human-readable tier label (title case for display).
 * "OUTSTANDING" → "Outstanding"
 */
export function getRatingTierLabel(rating: number | null | undefined): string {
  const tier = getRatingTier(rating);
  return tier
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}
