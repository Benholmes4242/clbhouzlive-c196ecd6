import { rampForRating } from '@/lib/ratingTier';

/**
 * Score ring color helpers — derived from canonical RATING_RAMPS to prevent
 * hex drift. Consumers: CommunityScoreCard, PersonalReviewCard.
 *
 * History: previously read hand-copied hexes from course-detail-tokens.ts
 * scoreRing (e.g. #FFC23D vs canon #FFCB45). Now single-sourced from
 * `@/lib/ratingTier` via `rampForRating`. See ratingTier.ts for tier bands.
 */

/**
 * Get score ring gradient colors (from/to) for SVG rendering.
 * `from` = ramp.mid (deeper), `to` = ramp.hi (brighter) — preserves the
 * previous visual weighting while sourcing from the canon.
 */
export const getScoreRingColors = (score: number) => {
  const ramp = rampForRating(score);
  return { from: ramp.mid, to: ramp.hi };
};
