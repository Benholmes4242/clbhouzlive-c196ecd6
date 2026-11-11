/**
 * THE ARGUMENT — BRIEF_TOP100_GOLFERS_VS_OFFICIAL (was BRIEF_TOP_100_REBUILD §3).
 *
 * Compares our members' rating ORDER with the published ORDER for the active
 * list. compareRows owns the complete qualifying order and category positions;
 * argumentGroups derives the three largest divergences on each side.
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
  subScores?: Partial<Record<Category, number | null>>;
}

export interface ArgumentRow extends ArgumentInput {
  publishedRank: number;
  rating: number;
  memberRank: number;
  listRank: number;
  /** Positive = our members place it higher than the list does. */
  divergence: number;
  categories?: Record<Category, { score: number | null; position: number | null }>;
}

export interface ArgumentGroups {
  higher: ArgumentRow[];
  lower: ArgumentRow[];
}

/** How many courses on the active list qualify (>= MIN_RATINGS, ranked). */
export function qualifyingCount(inputs: ArgumentInput[]): number {
  return inputs.filter((c) => c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS).length;
}

export const CATEGORIES = ['design', 'condition', 'facilities', 'clubhouse'] as const;
export type Category = typeof CATEGORIES[number];

export function compareRows(inputs: ArgumentInput[]): ArgumentRow[] {
  const set = inputs.filter(
    (c): c is ArgumentInput & { publishedRank: number; rating: number } =>
      c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS,
  );
  const byList = [...set].sort((a, b) => a.publishedRank - b.publishedRank);
  const byMembers = [...set].sort((a, b) => b.rating - a.rating || a.publishedRank - b.publishedRank);
  const listPos = new Map(byList.map((c, i) => [c.id, i + 1]));
  const memberPos = new Map(byMembers.map((c, i) => [c.id, i + 1]));
  const positions = Object.fromEntries(CATEGORIES.map(cat => [cat, new Map([...byList]
    .filter(c => c.subScores?.[cat] != null)
    .sort((a, b) => Number(b.subScores?.[cat]) - Number(a.subScores?.[cat]) || a.publishedRank - b.publishedRank)
    .map((c, i) => [c.id, i + 1]))])) as Record<Category, Map<string, number>>;
  return byList.map((c) => ({
    ...c,
    memberRank: memberPos.get(c.id) as number,
    listRank: listPos.get(c.id) as number,
    divergence: (listPos.get(c.id) as number) - (memberPos.get(c.id) as number),
    categories: Object.fromEntries(CATEGORIES.map(cat => [cat, { score: c.subScores?.[cat] ?? null, position: positions[cat].get(c.id) ?? null }])) as ArgumentRow['categories'],
  }));
}

export function argumentGroups(inputs: ArgumentInput[]): ArgumentGroups {
  const rows = compareRows(inputs);
  if (rows.length < MIN_QUALIFYING) return { higher: [], lower: [] };
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

import { ordinal } from '@/lib/text/numbers';
export function whyLine(row: ArgumentRow, n: number): string {
  if (row.divergence === 0) return `Golfers and the list agree: ${ordinal(row.memberRank)} of the ${n}`;
  const available = CATEGORIES.filter(cat => row.categories?.[cat].position != null && row.categories?.[cat].score != null);
  if (!available.length) return '';
  const higher = row.divergence > 0;
  const extreme = available.filter(cat => row.categories?.[cat].position === (higher ? 1 : n));
  const join = (cats: Category[]) => cats.length === 1 ? cats[0] : `${cats.slice(0, -1).join(', ')} and ${cats[cats.length - 1]}`;
  if (extreme.length) return `${higher ? 'Best' : 'Lowest'} ${join(extreme)} of the ${n}`;
  const cat = available.reduce((best, next) => {
    const a = row.categories?.[best].position ?? 0, b = row.categories?.[next].position ?? 0;
    return (higher ? b < a : b > a) ? next : best;
  });
  const value = row.categories?.[cat];
  if (value?.score == null || value.position == null) return '';
  return `${higher ? 'Strongest' : 'Weakest'} on ${cat}: ${value.score.toFixed(1)}, ${ordinal(value.position)} of the ${n}`;
}
