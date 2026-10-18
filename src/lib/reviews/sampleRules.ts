/** REVIEWS_SAMPLE_1: fixed sample policy for every Reviews state. No settings
 * or fallback defaults. Counts are community counts AFTER viewer exclusion.
 * Screen forms are introduced by the subsequent state briefs, not here. */
export const REVIEWS_SAMPLE = Object.freeze({ average: 2, distribution: 5, middle80: 10, splitBand: 10 });

export const hasCommunityAverage = (count: number): boolean => count >= REVIEWS_SAMPLE.average;
export const hasRatingDistribution = (count: number): boolean => count >= REVIEWS_SAMPLE.distribution;
export const subScoreBandStatistic = (count: number): 'min-max' | 'middle-80' =>
  count >= REVIEWS_SAMPLE.middle80 ? 'middle-80' : 'min-max';

/** A split needs at least two eligible bands; small bands are never drawn. */
export function showableSplitBands<T extends { count: number }>(bands: readonly T[]): T[] {
  const eligible = bands.filter((band) => band.count >= REVIEWS_SAMPLE.splitBand);
  return eligible.length >= 2 ? eligible : [];
}