// Shared rating badge logic used across Community Score and Edit Rating page

export type RatingBadgeKey = 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding';

/**
 * Determines the rating badge tier based on the score
 * Thresholds:
 * - >= 9.0: Outstanding
 * - >= 8.0: Excellent
 * - >= 7.0: Very Good
 * - >= 6.0: Good
 * - < 6.0: Fair
 */
export function getRatingBadgeKey(score: number | null | undefined): RatingBadgeKey | null {
  if (score == null || Number.isNaN(score)) return null;

  if (score >= 9.0) return 'outstanding';
  if (score >= 8.0) return 'excellent';
  if (score >= 7.0) return 'veryGood';
  if (score >= 6.0) return 'good';
  return 'fair';
}

/**
 * Returns the display label for a rating badge tier
 */
export function getRatingBadgeLabel(key: RatingBadgeKey | null): string {
  if (!key) return '';
  
  switch (key) {
    case 'outstanding': return 'Outstanding';
    case 'excellent': return 'Excellent';
    case 'veryGood': return 'Very Good';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
  }
}

/**
 * Badge color mapping using hex codes
 */
export const RATING_BADGE_COLORS = {
  fair: '#94A3B8',        // neutral grey (0.0–5.9)
  good: '#64748B',        // soft desaturated blue (6.0–6.9)
  veryGood: '#6EE7B7',    // mid green (7.0–7.9)
  excellent: '#22C55E',   // bright green (8.0–8.9)
  outstanding: '#F4C15D'  // gold (9.0–10.0)
};
