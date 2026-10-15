/**
 * BRIEF_ROUNDS_TAB_REBUILD phase 2 — every Rounds-tab figure reads off here,
 * so no two sections can disagree. Pure functions; "today" is always passed in.
 * Round unit is isFullEighteen; count and average share one population.
 */
import { isFullEighteen, type ProfileRound } from './useProfileRounds';

/** Local-time parse: a UTC parse puts January rounds in the previous year. */
export function parsePlayDate(v: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
}

const scoring = (r: ProfileRound) => isFullEighteen(r) && r.gross_score != null;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface PeriodStats {
  /** ALL rounds, nine-holers and unknown rows included. */
  rounds: number;
  /** Full-18 rounds with a gross. */
  scoringRounds: number;
  /** Mean gross over scoringRounds; null when there are none. */
  avg: number | null;
}

function periodOf(rows: ProfileRound[]): PeriodStats {
  const g = rows.filter(scoring).map((r) => r.gross_score as number);
  return { rounds: rows.length, scoringRounds: g.length, avg: mean(g) };
}

export function yearStats(rounds: ProfileRound[]): Map<number, PeriodStats> {
  const by = new Map<number, ProfileRound[]>();
  for (const r of rounds) {
    const y = parsePlayDate(r.play_date).getFullYear();
    by.set(y, [...(by.get(y) ?? []), r]);
  }
  const out = new Map<number, PeriodStats>();
  by.forEach((rows, y) => out.set(y, periodOf(rows)));
  return out;
}

/** Twelve entries (Jan..Dec). A month with no scoring round has avg null. */
export function monthStats(rounds: ProfileRound[], year: number): PeriodStats[] {
  const months: ProfileRound[][] = Array.from({ length: 12 }, () => []);
  for (const r of rounds) {
    const d = parsePlayDate(r.play_date);
    if (d.getFullYear() === year) months[d.getMonth()].push(r);
  }
  return months.map(periodOf);
}

export interface CourseStat {
  courseId: string | null;
  key: string;
  name: string | null;
  /** Full-18 rounds only. */
  rounds: number;
  /** Mean gross over the same full-18 rounds that have a gross. */
  avg: number | null;
}

/** Grouped by course_id (fallback name:<course_name>), most-played first. */
export function courseStats(rounds: ProfileRound[]): CourseStat[] {
  const by = new Map<string, { courseId: string | null; name: string | null; rows: ProfileRound[] }>();
  for (const r of rounds) {
    if (!isFullEighteen(r)) continue;
    const key = r.course_id || `name:${r.course_name ?? 'unknown'}`;
    const e = by.get(key) ?? { courseId: r.course_id ?? null, name: r.course_name, rows: [] };
    e.rows.push(r);
    by.set(key, e);
  }
  return [...by.entries()]
    .map(([key, e]) => ({
      key,
      courseId: e.courseId,
      name: e.name,
      rounds: e.rows.length,
      avg: mean(e.rows.filter((r) => r.gross_score != null).map((r) => r.gross_score as number)),
    }))
    .sort((a, b) => b.rounds - a.rounds);
}

/** delta = lastAvg - thisAvg: POSITIVE means this year is better. */
export function seasonCompare(rounds: ProfileRound[], year: number) {
  const ys = yearStats(rounds);
  const thisAvg = ys.get(year)?.avg ?? null;
  const lastAvg = ys.get(year - 1)?.avg ?? null;
  return { thisAvg, lastAvg, delta: thisAvg != null && lastAvg != null ? lastAvg - thisAvg : null };
}
