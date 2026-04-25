import { courseDetailTokens } from '@/styles/course-detail-tokens';
import { getRatingTier } from '@/lib/ratingTier';

/**
 * Score ring color helpers — the only surviving export of this module.
 *
 * History: this file previously housed bucketing helpers (useTierStyles,
 * getTierKeyFromScore, getTierLabel, getTierFromLabel) that duplicated
 * canonical tier logic. They had zero consumers and were silently broken
 * for scores ≥ 9.5 (capped at "Outstanding"). Deleted Apr 2026.
 *
 * For score → tier mapping, use canonical helpers from `@/lib/ratingTier`
 * (`getRatingTier`, `getRatingTierLabel`) directly. Do NOT reintroduce
 * bucketing helpers here.
 */

// Local mapping from canonical RatingTier strings → the keys used by
// courseDetailTokens.scoreRing. Keeping this explicit gives us TypeScript
// exhaustiveness checking and a single edit point if scoreRing keys change.
const RATING_TIER_TO_RING_KEY: Record<
  ReturnType<typeof getRatingTier>,
  keyof typeof courseDetailTokens.scoreRing
> = {
  EXCEPTIONAL: 'exceptional',
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
};

/**
 * Get score ring gradient colors (from/to) for SVG rendering.
 * Consumed by PersonalReviewCard.tsx.
 */
export const getScoreRingColors = (score: number) => {
  const key = RATING_TIER_TO_RING_KEY[getRatingTier(score)];
  return courseDetailTokens.scoreRing[key];
};
