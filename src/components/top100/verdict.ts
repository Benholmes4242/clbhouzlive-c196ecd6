/**
 * The Top 100 verdict calculation.
 *
 * Published rank and member rating are different scales, so rank is first
 * mapped onto the rating scale:
 *
 *   expected(rank) = 10 - (rank - 1) * 0.02      // #1 -> 10.0, #100 -> 8.0
 *   gap            = member_rating - expected(rank)
 *
 * A verdict is only a claim worth making when the gap clears the configured
 * threshold AND enough members have rated the course. Agreement is not news,
 * so the neutral band renders nothing at all.
 *
 * The three inputs are read from public.feed_config (see useTop100Config):
 *   t100_verdict_enabled, t100_verdict_min_ratings, t100_verdict_threshold
 * Nothing here is hardcoded beyond the curve itself.
 */

export type VerdictDirection = 'higher' | 'lower';

export interface VerdictConfig {
  enabled: boolean;
  minRatings: number;
  threshold: number;
}

export interface Verdict {
  direction: VerdictDirection;
  gap: number;
  rank: number;
  rating: number;
  ratingCount: number;
}

/** Rating a course at this published rank would be expected to carry. */
export function expectedRating(rank: number): number {
  return 10 - (rank - 1) * 0.02;
}

export function computeVerdict(args: {
  rank: number | null | undefined;
  rating: number | null | undefined;
  ratingCount: number;
  config: VerdictConfig;
}): Verdict | null {
  const { rank, rating, ratingCount, config } = args;

  if (!config.enabled) return null;
  if (rank == null || rank <= 0) return null;
  if (rating == null) return null;
  if (ratingCount < config.minRatings) return null;

  const gap = rating - expectedRating(rank);
  if (Math.abs(gap) < config.threshold) return null;

  return {
    direction: gap > 0 ? 'higher' : 'lower',
    gap: Math.round(gap * 100) / 100,
    rank,
    rating,
    ratingCount,
  };
}
