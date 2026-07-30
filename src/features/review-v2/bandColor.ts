/**
 * The one colour scale for review-v2 scores.
 * Do not re-declare these hexes anywhere else in the feature.
 */

export const BAND_GREEN = '#047857';
export const BAND_AMBER = '#F7931E';
export const BAND_RED   = '#DC2626';

/** >= 9.0 green, >= 5.0 amber, below 5.0 red. */
export function bandColor(score: number | null | undefined): string {
  if (score == null) return '#AEB4BC';
  if (score >= 9) return BAND_GREEN;
  if (score >= 5) return BAND_AMBER;
  return BAND_RED;
}
