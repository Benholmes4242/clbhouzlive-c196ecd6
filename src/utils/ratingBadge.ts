// DEPRECATED: Use ratingBands.ts instead
// This file is kept for backwards compatibility during migration

import { getRatingBand, RATING_BANDS } from './ratingBands';

export type RatingBadgeKey = 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding';

/**
 * @deprecated Use getRatingBand() from ratingBands.ts instead
 */
export function getRatingBadgeKey(score: number | null | undefined): RatingBadgeKey | null {
  if (score == null || Number.isNaN(score)) return null;
  const band = getRatingBand(score);
  return band.id as RatingBadgeKey;
}

/**
 * @deprecated Use getRatingBandLabel() from ratingBands.ts instead
 */
export function getRatingBadgeLabel(key: RatingBadgeKey | null): string {
  if (!key) return '';
  const band = RATING_BANDS.find(b => b.id === key);
  return band ? band.label : '';
}

/**
 * @deprecated Use getRatingBandColor() from ratingBands.ts instead
 */
export const RATING_BADGE_COLORS: Record<RatingBadgeKey, string> = {
  fair: '#94A3B8',
  good: '#64748B',
  veryGood: '#6EE7B7',
  excellent: '#22C55E',
  outstanding: '#F4C15D'
};
