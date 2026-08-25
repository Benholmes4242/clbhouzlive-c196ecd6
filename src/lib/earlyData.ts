/**
 * EARLY DATA threshold - single source of truth.
 *
 * The threshold now serves club analytics only. Courses stat browse and
 * Discover rails no longer surface an "Early data" label on the course card,
 * so this constant is the shared guard used by the business club-analytics
 * surface to flag rankings with a small sample.
 *
 * Change the number here and every surface follows.
 *
 * ASCII only.
 */
export const EARLY_DATA_MIN_ROUNDS = 10;

export function isEarlyData(rounds: number | null | undefined): boolean {
  return rounds != null && rounds < EARLY_DATA_MIN_ROUNDS;
}
