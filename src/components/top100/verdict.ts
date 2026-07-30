/**
 * The Top 100 verdict calculation.
 *
 * Published rank and member rating are different scales, so rank is first
 * mapped onto the rating scale:
 *
 *   expected(rank) = anchor - slope * rank
 *   gap            = member_rating - expected(rank)
 *
 * anchor and slope are fitted from live member ratings across the rated
 * Top 100 set (rating = 9.36 - 0.0100 * rank) and are read from config.
 *
 * A verdict is only a claim worth making when the gap clears the configured
 * threshold AND enough members have rated the course. Agreement is not news,
 * so the neutral band renders nothing at all.
 *
 * Every input is read from public.feed_config (see useTop100Config):
 *   t100_verdict_enabled, t100_verdict_min_ratings, t100_verdict_threshold,
 *   t100_verdict_anchor, t100_verdict_slope
 * Nothing here is hardcoded.
 */

export type VerdictDirection = 'higher' | 'lower';

export interface VerdictConfig {
  enabled: boolean;
  minRatings: number;
  threshold: number;
  /** Rating expected at rank 0 on the fitted line. */
  anchor: number;
  /** Rating lost per rank place. POSITIVE, and subtracted. */
  slope: number;
}

export interface Verdict {
  direction: VerdictDirection;
  gap: number;
  rank: number;
  rating: number;
  ratingCount: number;
}

/** Rating a course at this published rank would be expected to carry. */
export function expectedRating(rank: number, config: VerdictConfig): number {
  return config.anchor - config.slope * rank;
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

  const gap = rating - expectedRating(rank, config);
  if (Math.abs(gap) < config.threshold) return null;

  return {
    direction: gap > 0 ? 'higher' : 'lower',
    gap: Math.round(gap * 100) / 100,
    rank,
    rating,
    ratingCount,
  };
}

/**
 * Shorten a club name for the verdict band ONLY. The card title keeps the
 * full name. Only the full multi-word phrases below are stripped, and only
 * when preceded by a space and followed by end-of-string or " (", so
 * "European Club" and "The Honors Course" are left alone and any
 * parenthetical (Old), (Championship), (Hotchkin) always survives.
 */
const SHORTEN_PHRASES = [
  'Golf and Country Club',
  'Golf & Country Club',
  'Golf Club',
  'Golf Links',
  'Golf Resort',
  'Golf Course',
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function shortenCourseName(name: string): string {
  let out = name;
  for (const phrase of SHORTEN_PHRASES) {
    const re = new RegExp(`\\s${escapeRegExp(phrase)}(?=$|\\s\\()`);
    const next = out.replace(re, '');
    if (next !== out) {
      out = next;
      break;
    }
  }
  return out.trim();
}
