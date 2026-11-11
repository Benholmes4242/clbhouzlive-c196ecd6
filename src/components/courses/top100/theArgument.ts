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
export const CATEGORIES = ['design', 'condition', 'facilities', 'clubhouse'] as const;
export type Category = typeof CATEGORIES[number];
export function shortenCourseName(name: string): string {
  return name.replace(/ (Golf and Country Club|Golf & Country Club|Golf Club|Golf Links|Golf Resort|Golf Course)(?=$| \()/, '');
}

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
  categoryPositions?: Partial<Record<Category, number>>;
}

export interface ArgumentGroups {
  higher: ArgumentRow[];
  lower: ArgumentRow[];
}

/** How many courses on the active list qualify (>= MIN_RATINGS, ranked). */
export function qualifyingCount(inputs: ArgumentInput[]): number {
  return inputs.filter((c) => c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS).length;
}

/** One shared qualifying set owns the chart, explanations and golfers' order. */
export function compareRows(inputs: ArgumentInput[]): ArgumentRow[] {
  const set = inputs.filter((c): c is ArgumentInput & { publishedRank: number; rating: number } => c.publishedRank != null && c.rating != null && c.ratingCount >= MIN_RATINGS);
  const byList = [...set].sort((a,b) => a.publishedRank - b.publishedRank);
  const byMembers = [...set].sort((a,b) => b.rating - a.rating || a.publishedRank - b.publishedRank);
  const memberPos = new Map(byMembers.map((c,i) => [c.id,i+1]));
  const categories = Object.fromEntries(CATEGORIES.map(cat => [cat, new Map([...set].filter(c => c.subScores?.[cat] != null).sort((a,b) => (b.subScores?.[cat] ?? 0) - (a.subScores?.[cat] ?? 0) || a.publishedRank - b.publishedRank).map((c,i) => [c.id,i+1]))])) as Record<Category, Map<string,number>>;
  return byList.map((c,i) => ({ ...c, listRank:i+1, memberRank:memberPos.get(c.id) ?? i+1, divergence:i+1-(memberPos.get(c.id) ?? i+1), categoryPositions:Object.fromEntries(CATEGORIES.flatMap(cat => { const pos=categories[cat].get(c.id); return pos == null ? [] : [[cat,pos]]; })) }));
}
export function argumentGroups(inputs: ArgumentInput[]): ArgumentGroups {
  const rows = compareRows(inputs);
  if (rows.length < MIN_QUALIFYING) return { higher:[], lower:[] };
  return {
    higher:rows.filter(c => c.divergence > 0).sort((a,b) => b.divergence-a.divergence || a.publishedRank-b.publishedRank).slice(0,ARGUMENT_ROWS),
    lower:rows.filter(c => c.divergence < 0).sort((a,b) => a.divergence-b.divergence || a.publishedRank-b.publishedRank).slice(0,ARGUMENT_ROWS),
  };
}
function ord(n: number): string { const mod=n%100; return `${n}${mod>=11 && mod<=13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n%10] ?? 'th')}`; }
function joined(cats: string[]): string { return cats.length < 2 ? cats.join('') : `${cats.slice(0,-1).join(', ')} and ${cats[cats.length-1]}`; }
export function whyLine(row: ArgumentRow, n: number): string {
  if (row.divergence === 0) return `Golfers and the list agree: ${ord(row.memberRank)} of the ${n}`;
  const available=CATEGORIES.filter(cat => row.categoryPositions?.[cat] != null && row.subScores?.[cat] != null);
  const higher=row.divergence>0;
  const extremes=available.filter(cat => row.categoryPositions?.[cat] === (higher ? 1 : n));
  if (extremes.length) return `${higher ? 'Best' : 'Lowest'} ${joined(extremes)} of the ${n}`;
  const cat=[...available].sort((a,b) => ((row.categoryPositions?.[a] ?? 0)-(row.categoryPositions?.[b] ?? 0))*(higher ? 1 : -1))[0];
  if (!cat) return '';
  return `${higher ? 'Strongest' : 'Weakest'} on ${cat}: ${(row.subScores?.[cat] ?? 0).toFixed(1)}, ${ord(row.categoryPositions?.[cat] ?? 0)} of the ${n}`;
}
