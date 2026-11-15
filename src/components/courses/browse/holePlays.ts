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
 */

import { ordinal } from '@/components/courses/course-detail/you/youBits';

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

/** The signed average exactly as the mock prints it: +0.42, −0.15, level for 0. */
export function playsFigure(avg: number): string {
  if (!Number.isFinite(avg) || avg === 0) return 'level';
  return avg > 0 ? `+${avg.toFixed(2)}` : `\u2212${Math.abs(avg).toFixed(2)}`;
}

/** Rank 1 is the hardest hole outright; every other rank is an ordinal. */
export function rankPhrase(rank: number): string {
  return rank === 1 ? 'Hardest hole' : `${ordinal(rank)} hardest hole`;
}

/** The same sentence for the tile's aria-label, in mid-sentence case. */
export function ariaRankPhrase(rank: number): string {
  return rank === 1 ? 'hardest hole' : `${ordinal(rank)} hardest hole`;
}

/** Under par is the one red figure on the pill. */
export const playsIsUnderPar = (avg: number): boolean => Number.isFinite(avg) && avg < 0;

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
