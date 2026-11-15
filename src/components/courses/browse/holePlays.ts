/**
 * The "Plays" pill on the Latest holes rail (BRIEF_COURSES_MEMBERS_SECTIONS §1).
 *
 * Rules live here so the rail, its card and its tests read one definition:
 * get_course_hole_ranks returns the same rounds and arithmetic as
 * get_course_hole_analysis, so the pill always agrees with the course page's
 * hardest hole (a tie goes to the lower hole number there, and the RPC owns
 * that ordering — this module never re-ranks).
 *
 * The ordinal is the courses surface's own helper (youBits), the same one the
 * club "hardest hole" cell prints.
 *
 * Two floors live here and both may only ever be TIGHTENED by the client:
 *  - the ordinal needs RANK_ORDINAL_MIN_PLAYS plays behind it;
 *  - the to-par figure is the canonical Courses spelling (fmtToPar): rounded
 *    first, then signed, at the stat chip's one decimal.
 * The RPC's own floors (a course needs 20 tracked rounds) are server-side by
 * decision: the client may tighten, never loosen, and never hides a tile.
 */

import { ordinal } from '@/components/courses/course-detail/you/youBits';
import { fmtToPar } from './format';

/** One row of get_course_hole_ranks. */
export interface CourseHoleRank {
  course_id: string;
  hole_no: number;
  rounds: number;
  /** Numeric, 2dp, as the RPC returns it. */
  avg_to_par: number;
  /** 1 = hardest. */
  difficulty_rank: number;
  holes_ranked: number;
}

/** get_course_hole_ranks accepts at most 50 ids per call. */
export const RANKS_MAX_IDS = 50;

/** A rank belongs to one course AND one hole, never to either alone. */
export const rankKey = (courseId: string, holeNo: number): string => `${courseId}|${holeNo}`;

/** Fewest plays that let a rank state its ordinal. Below this the pill keeps the
 * Plays figure and says nothing about difficulty: withholding a claim is safe,
 * making a false one is not. */
export const RANK_ORDINAL_MIN_PLAYS = 10;

/** True when a rank row carries enough plays to state its ordinal. A row with no
 * usable count states nothing. */
export const rankIsOrdinable = (rank: CourseHoleRank): boolean =>
  Number.isFinite(rank.rounds) && rank.rounds >= RANK_ORDINAL_MIN_PLAYS;

/** The signed average at the stat chip's precision: ONE decimal, rounded FIRST,
 * so a value that rounds to par reads "level" and never "+0.0" or "−0.0". The
 * spelling is the canonical Courses to-par value (fmtToPar): true minus, "level"
 * at exactly par. */
export function playsFigure(avg: number): string {
  return fmtToPar(avg) ?? 'level';
}

/** Rank 1 is the hardest hole outright; every other rank is an ordinal. */
export function rankPhrase(rank: number): string {
  return rank === 1 ? 'Hardest hole' : `${ordinal(rank)} hardest hole`;
}

/** The same sentence for the tile's aria-label, in mid-sentence case. */
export function ariaRankPhrase(rank: number): string {
  return rank === 1 ? 'hardest hole' : `${ordinal(rank)} hardest hole`;
}

/** Under par is the one red figure on the pill, and it follows the figure the
 * pill actually prints: a value that rounds to "level" is never red. */
export const playsIsUnderPar = (avg: number): boolean => (fmtToPar(avg) ?? '').startsWith('\u2212');

/**
 * Only complete rank rows count. A row missing its rank or its average must
 * never draw a half pill, and a payload that is not a list (a stubbed client, a
 * drifted contract) reads as no ranks at all — never as a broken tile.
 */
export function toRanksMap(rows: unknown): Map<string, CourseHoleRank> {
  const map = new Map<string, CourseHoleRank>();
  if (!Array.isArray(rows)) return map;
  for (const raw of rows) {
    const row = raw as Partial<CourseHoleRank> | null;
    if (!row || typeof row.course_id !== 'string' || typeof row.hole_no !== 'number') continue;
    if (typeof row.avg_to_par !== 'number' || typeof row.difficulty_rank !== 'number') continue;
    map.set(rankKey(row.course_id, row.hole_no), row as CourseHoleRank);
  }
  return map;
}
