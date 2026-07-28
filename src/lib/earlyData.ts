/**
 * EARLY DATA threshold - single source of truth.
 *
 * Neither the Courses stat browse nor the Discover rails apply a
 * minimum-rounds filter to their rankings; instead, any course whose
 * ranking rests on fewer than EARLY_DATA_MIN_ROUNDS recorded rounds is
 * labelled "Early data" so the reader can judge the sample for themselves.
 *
 * Change the number here and every surface follows.
 *
 * ASCII only.
 */
export const EARLY_DATA_MIN_ROUNDS = 10;

export function isEarlyData(rounds: number | null | undefined): boolean {
  return rounds != null && rounds < EARLY_DATA_MIN_ROUNDS;
}
