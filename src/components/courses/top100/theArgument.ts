/**
 * THE ARGUMENT — BRIEF_TOP100_GOLFERS_VS_OFFICIAL (was BRIEF_TOP_100_REBUILD §3).
 *
 * Compares our members' rating ORDER with the published ORDER for the active
 * list. It does not publish a rival Top 100: only the three largest
 * divergences in each direction are returned, never a ranked list.
 *
 * Both orders are taken WITHIN THE SAME QUALIFYING SET (courses with at least
 * MIN_RATINGS ratings and a published rank). Comparing a rank among ~20 rated
 * courses with a raw published rank out of 100 would show nearly every course
 * as "we rank it higher" by construction. The official rank out of 100 is not
 * printed in this section — rows read both positions within the qualifying set.
 */
export const MIN_RATINGS = 3;
export const MIN_QUALIFYING = 3;
/** Cap PER GROUP — up to three risers and up to three fallers. */
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
  memberRank: number;
  listRank: number;
  /** Positive = our members place it higher than the list does. */
  divergence: number;
}

export interface ArgumentGroups {
  higher: ArgumentRow[];
  lower: ArgumentRow[];
}

/** How many courses on the active list qualify (>= MIN_RATINGS, ranked). */
export function qualifyingCount(inputs: ArgumentInput[]): number {
  return inputs.filter((c) => c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS).length;
}

export function argumentGroups(inputs: ArgumentInput[]): ArgumentGroups {
  const empty: ArgumentGroups = { higher: [], lower: [] };
  const set = inputs.filter(
    (c): c is ArgumentInput & { publishedRank: number; rating: number } =>
      c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS,
  );
  if (set.length < MIN_QUALIFYING) return empty;
  const byList = [...set].sort((a, b) => a.publishedRank - b.publishedRank);
  const byMembers = [...set].sort((a, b) => b.rating - a.rating || a.publishedRank - b.publishedRank);
  const listPos = new Map(byList.map((c, i) => [c.id, i + 1]));
  const memberPos = new Map(byMembers.map((c, i) => [c.id, i + 1]));
  const rows = set.map((c) => ({
    ...c,
    memberRank: memberPos.get(c.id) as number,
    listRank: listPos.get(c.id) as number,
    divergence: (listPos.get(c.id) as number) - (memberPos.get(c.id) as number),
  }));
  return {
    higher: rows
      .filter((c) => c.divergence > 0)
      .sort((a, b) => b.divergence - a.divergence || a.publishedRank - b.publishedRank)
      .slice(0, ARGUMENT_ROWS),
    lower: rows
      .filter((c) => c.divergence < 0)
      .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence) || a.publishedRank - b.publishedRank)
      .slice(0, ARGUMENT_ROWS),
  };
}
