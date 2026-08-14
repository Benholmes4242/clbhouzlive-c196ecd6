/**
 * REVIEW RATING TONE — the rating scale's own colour scale
 * (BRIEF_REVIEW_TILE_BREAKDOWN §3).
 *
 * A review score is NOT a golf score. It takes NEITHER the to-par pair
 * (#0F8F4A / #C8372B) NOR the index-delta pair. There is deliberately NO RED
 * anywhere on this scale: these are members rating real, named clubs, and an
 * honest 6.2 must not render as an alarm against a course that has done nothing
 * wrong. A cool grey says "lower" without saying "bad".
 *
 *   >= 8.5   #0F8F4A   strong
 *   7.0-8.4  #F7931E   solid
 *   < 7.0    #7C8B9C   cool grey — NOT a red
 *
 * DO NOT harmonise this with a scoring red, and do not route it through
 * ratingTier.ts: that file's ramps are the composer's warm ember/gold fills
 * (#C9670F / #FFCB45), a different job with different thresholds.
 */

export const RATING_TONE_STRONG = '#0F8F4A';
export const RATING_TONE_SOLID = '#F7931E';
export const RATING_TONE_QUIET = '#7C8B9C';

export function ratingTone(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return RATING_TONE_QUIET;
  if (value >= 8.5) return RATING_TONE_STRONG;
  if (value >= 7.0) return RATING_TONE_SOLID;
  return RATING_TONE_QUIET;
}

export default ratingTone;
