/**
 * Rating tier taxonomy for Clbhouz reviews.
 * Canonical tier taxonomy used across review post surfaces.
 *
 * 5-tier system (April 2026 rebalance):
 *   EXCEPTIONAL ≥9.0   (width 1.0)
 *   EXCELLENT   7.5-8.9 (width 1.4)
 *   GOOD        6.0-7.4 (width 1.4)
 *   FAIR        4.0-5.9 (width 2.0)
 *   POOR        <4.0    (width 4.0)
 *
 * "Outstanding" and "Very Good" no longer exist. ≥9.0 is now Exceptional;
 * 7.5–7.9 ratings promote to Excellent; 7.0–7.4 ratings demote to Good.
 * `null` ratings map to POOR (semantically the worst case — no rating exists).
 */

export type RatingTier =
  | 'EXCEPTIONAL'
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR';

export function getRatingTier(rating: number | null | undefined): RatingTier {
  if (rating == null) return 'POOR';
  if (rating >= 9.0) return 'EXCEPTIONAL';
  if (rating >= 7.5) return 'EXCELLENT';
  if (rating >= 6.0) return 'GOOD';
  if (rating >= 4.0) return 'FAIR';
  return 'POOR';
}

/**
 * Human-readable tier label (title case for display).
 * "EXCEPTIONAL" → "Exceptional"
 */
export function getRatingTierLabel(rating: number | null | undefined): string {
  const tier = getRatingTier(rating);
  return tier
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}
