/**
 * yourCoursesListRules — pure rules for the Your courses sheet list (YC1).
 *
 * Everything the list decides WITHOUT rendering lives here so the tests pin
 * the rule, not the paint: tile qualification and picks, the three sort
 * orders, the figure label, the early-data gate and the list date format.
 */

import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';

/** A course qualifies for the tiles at 10+ rounds with a known average. */
export const TILE_MIN_ROUNDS = 10;

export type CourseSort = 'recent' | 'most-played' | 'best-for-you';

export function hasAvg(c: UserAnalyticsCourse): boolean {
  return c.avg_to_par !== null && c.avg_to_par !== undefined;
}

export function qualifiesForTile(c: UserAnalyticsCourse): boolean {
  return (c.rounds_count ?? 0) >= TILE_MIN_ROUNDS && hasAvg(c);
}

/** Recent: last played first; nulls last; ties on rounds so a same-day pair
 *  is stable. This is the order the list has always used. */
function byRecent(a: UserAnalyticsCourse, b: UserAnalyticsCourse): number {
  const ta = a.last_played ? Date.parse(a.last_played) : null;
  const tb = b.last_played ? Date.parse(b.last_played) : null;
  if (ta == null && tb == null) return (b.rounds_count ?? 0) - (a.rounds_count ?? 0);
  if (ta == null) return 1;
  if (tb == null) return -1;
  if (tb !== ta) return tb - ta;
  return (b.rounds_count ?? 0) - (a.rounds_count ?? 0);
}

export function sortCourses(
  courses: UserAnalyticsCourse[],
  sort: CourseSort,
): UserAnalyticsCourse[] {
  const list = [...courses];
  if (sort === 'recent') return list.sort(byRecent);
  if (sort === 'most-played') {
    return list.sort(
      (a, b) => (b.rounds_count ?? 0) - (a.rounds_count ?? 0) || byRecent(a, b),
    );
  }
  // Best for you: qualified courses (10+ rounds, known avg) by avg ascending,
  // then the rest by avg ascending, nulls last.
  return list.sort((a, b) => {
    const qa = qualifiesForTile(a) ? 0 : 1;
    const qb = qualifiesForTile(b) ? 0 : 1;
    if (qa !== qb) return qa - qb;
    const av = hasAvg(a) ? (a.avg_to_par as number) : null;
    const bv = hasAvg(b) ? (b.avg_to_par as number) : null;
    if (av == null && bv == null) return byRecent(a, b);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av !== bv) return av - bv;
    return byRecent(a, b);
  });
}

export interface CourseTiles {
  best: UserAnalyticsCourse;
  bites: UserAnalyticsCourse;
}

/**
 * The two header tiles. "Where you score best" is the LOWEST avg_to_par among
 * qualifying courses, "Where it bites" the HIGHEST; ties break on more
 * rounds. Null when fewer than two courses qualify — both tiles hide.
 */
export function pickTiles(courses: UserAnalyticsCourse[]): CourseTiles | null {
  const qualified = courses.filter(qualifiesForTile);
  if (qualified.length < 2) return null;
  const byAvgAsc = (a: UserAnalyticsCourse, b: UserAnalyticsCourse) =>
    (a.avg_to_par as number) - (b.avg_to_par as number) ||
    (b.rounds_count ?? 0) - (a.rounds_count ?? 0);
  const best = [...qualified].sort(byAvgAsc)[0];
  const bites = [...qualified].sort((a, b) => byAvgAsc(b, a))[0];
  return { best, bites };
}

/** Early data: under 10 rounds the figure mutes and the meta carries a tag. */
export function isEarlyData(c: UserAnalyticsCourse): boolean {
  return (c.rounds_count ?? 0) < TILE_MIN_ROUNDS;
}

export type FigureLabel = 'a-round' | 'one-round' | 'n-rounds';

/** The label under the figure: "a round" at 10+, "{n} rounds" for 2–9,
 *  "one round" for 1. */
export function figureLabel(rounds: number): FigureLabel {
  if (rounds >= TILE_MIN_ROUNDS) return 'a-round';
  if (rounds === 1) return 'one-round';
  return 'n-rounds';
}

/**
 * The meta date: day and short month ("29 Oct"), adding the year only when
 * it isn't this year ("3 Sep 2025"). English short months — the sheet's list
 * is sentence-case English like the rest of the sheet.
 */
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function fmtListDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const base = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear()
    ? base
    : `${base} ${d.getFullYear()}`;
}
