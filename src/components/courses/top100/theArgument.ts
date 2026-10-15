/**
 * THE ARGUMENT — BRIEF_TOP_100_REBUILD §3.
 *
 * Compares our members' rating ORDER with the published ORDER for the active
 * list. It does not publish a rival Top 100: only the three largest
 * divergences are returned, never a ranked list.
 *
 * Both orders are taken WITHIN THE SAME QUALIFYING SET (courses with at least
 * MIN_RATINGS ratings and a published rank). Comparing a rank among ~20 rated
 * courses with a raw published rank out of 100 would show nearly every course
 * as "we rank it higher" by construction. The row still prints the real
 * published rank ("List says #3").
 */
export const MIN_RATINGS = 3;
export const MIN_QUALIFYING = 3;
export const ARGUMENT_ROWS = 3;

export interface ArgumentInput {
  id: string;
  name: string;
  imageUrl: string | null;
  publishedRank: number | null;
  rating: number | null;
  ratingCount: number;
}

export interface ArgumentRow extends ArgumentInput {
  publishedRank: number;
  rating: number;
  /** Positive = our members place it higher than the list does. */
  divergence: number;
}

export function argumentRows(inputs: ArgumentInput[]): ArgumentRow[] {
  const set = inputs.filter(
    (c): c is ArgumentInput & { publishedRank: number; rating: number } =>
      c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS,
  );
  if (set.length < MIN_QUALIFYING) return [];
  const byList = [...set].sort((a, b) => a.publishedRank - b.publishedRank);
  const byMembers = [...set].sort((a, b) => b.rating - a.rating || a.publishedRank - b.publishedRank);
  const listPos = new Map(byList.map((c, i) => [c.id, i + 1]));
  const memberPos = new Map(byMembers.map((c, i) => [c.id, i + 1]));
  return set
    .map((c) => ({ ...c, divergence: (listPos.get(c.id) as number) - (memberPos.get(c.id) as number) }))
    .filter((c) => c.divergence !== 0)
    .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence) || a.publishedRank - b.publishedRank)
    .slice(0, ARGUMENT_ROWS);
}
