/** Pure rules for the Review a course sheet (review-course-search-signed-off.html). */
import { courseRankLabels, RANK_LIST_BY_SLUG, type RankList } from '@/features/courses/_shared/courseRankLabels';

export const RECENT_CAP = 2;
export const THRESHOLD_CAP = 2;
export const POPULAR_CAP = 3;
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 200;
export const SEARCH_LIMIT = 30;

export type PickList = 'recent' | 'threshold' | 'popular' | 'search';

export interface ReviewCourseRow {
  id: string;
  name: string;
  region: string | null;
  subCountry: string | null;
  country: string | null;
  thumbnail: string | null;
  avg: number | null;
  count: number;
  mine: number | null;
  rank: string | null;
}

/** First qualifying label from courseRankLabels (global first); null when none. */
export function firstRankLabel(memberships: Array<{ slug: string; rank: number; active?: boolean }>): string | null {
  const entries = memberships
    .filter(m => m.active !== false && RANK_LIST_BY_SLUG[m.slug])
    .map(m => ({ list: RANK_LIST_BY_SLUG[m.slug] as RankList, rank: Number(m.rank) }));
  return courseRankLabels(entries)[0] ?? null;
}

/** The idle lists: recent (reviewed kept), then threshold and popular (reviewed
 * excluded), each course once across the three. Inputs are already ordered. */
export function buildIdleLists(input: { recent: string[]; threshold: string[]; popular: string[]; reviewed: Set<string> }) {
  const used = new Set<string>();
  const take = (ids: string[], cap: number, excludeReviewed: boolean) => {
    const out: string[] = [];
    for (const id of ids) {
      if (out.length >= cap) break;
      if (used.has(id) || (excludeReviewed && input.reviewed.has(id))) continue;
      used.add(id); out.push(id);
    }
    return out;
  };
  const recent = take(input.recent, RECENT_CAP, false);
  const threshold = take(input.threshold, THRESHOLD_CAP, true);
  const popular = take(input.popular, POPULAR_CAP, true);
  return { recent, threshold, popular };
}

/** Courses ranked by review count over the window, ties by most recent review. */
export function rankPopular(ratings: Array<{ course_id: string; created_at: string }>): string[] {
  const m = new Map<string, { n: number; last: string }>();
  for (const r of ratings) {
    const cur = m.get(r.course_id) ?? { n: 0, last: '' };
    cur.n += 1; if (r.created_at > cur.last) cur.last = r.created_at;
    m.set(r.course_id, cur);
  }
  return [...m.entries()].sort((a, b) => b[1].n - a[1].n || (a[1].last < b[1].last ? 1 : -1)).map(([id]) => id);
}

/** Unique course ids in newest-review-first order. */
export function newestFirst(ratings: Array<{ course_id: string; created_at: string }>): string[] {
  const sorted = [...ratings].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const seen = new Set<string>(); const out: string[] = [];
  for (const r of sorted) if (!seen.has(r.course_id)) { seen.add(r.course_id); out.push(r.course_id); }
  return out;
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
export const numberWord = (n: number) => WORDS[n] ?? String(n);
export const ordinalWord = (n: number) => ORDINALS[n] ?? `${n}th`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function thresholdExplainer(min: number) {
  const have = min - 1;
  return `${cap(numberWord(have))} ${have === 1 ? 'member has' : 'members have'} reviewed each of these. A ${ordinalWord(min)} review shows their design, condition, clubhouse and facilities scores.`;
}

export const reviewsLabel = (n: number) => `${n} ${n === 1 ? 'review' : 'reviews'}`;

export function placeLine(r: Pick<ReviewCourseRow, 'region' | 'subCountry' | 'country'>, mode: 'idle' | 'search') {
  const local = r.region?.trim() || r.subCountry?.trim() || '';
  if (mode === 'idle') return local || r.country?.trim() || '';
  return [r.region?.trim(), r.country?.trim()].filter(Boolean).join(', ') || local;
}

/** Case-insensitive match parts; every occurrence is a match part. */
export function highlightParts(name: string, q: string): Array<{ text: string; match: boolean }> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [{ text: name, match: false }];
  const lower = name.toLowerCase();
  const out: Array<{ text: string; match: boolean }> = [];
  let i = 0;
  while (i < name.length) {
    const at = lower.indexOf(needle, i);
    if (at < 0) { out.push({ text: name.slice(i), match: false }); break; }
    if (at > i) out.push({ text: name.slice(i, at), match: false });
    out.push({ text: name.slice(at, at + needle.length), match: true });
    i = at + needle.length;
  }
  return out;
}

export type RightState =
  | { kind: 'mine'; score: string }
  | { kind: 'scored'; score: string; count: string }
  | { kind: 'bethe'; label: string; count: string }
  | { kind: 'first' };

export function rightState(r: Pick<ReviewCourseRow, 'mine' | 'avg' | 'count'>, list: PickList, min: number): RightState {
  if (r.mine != null) return { kind: 'mine', score: r.mine.toFixed(1) };
  if (list === 'threshold') return { kind: 'bethe', label: `Be the ${ordinalWord(min)}`, count: reviewsLabel(r.count) };
  if (r.count > 0 && r.avg != null) return { kind: 'scored', score: r.avg.toFixed(1), count: reviewsLabel(r.count) };
  return { kind: 'first' };
}
