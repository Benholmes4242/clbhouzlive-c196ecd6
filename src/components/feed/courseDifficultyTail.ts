/**
 * courseDifficultyTail — ONE definition of "this percentile says something".
 *
 * BRIEF_ROUND_CARD_CONTEXT §3. PostCourseBand has withheld mid-distribution
 * percentiles since it shipped: a course harder than 46% of courses is an
 * ordinary course, and printing that is noise dressed as insight. The round
 * card's slope gloss needs exactly the same judgement, so the thresholds and
 * the sample floor live here and BOTH sites read them. Two copies of 85/15
 * would drift the first time either moved.
 *
 * The floor is the band's own `rounds < 3` rule (PostCourseBand
 * pickCourseBandFigure), not a second one.
 */
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';

/** Harder than this share of courses -> the hard tail. */
export const HARD_TAIL = 85;
/** Harder than no more than this share -> the easy tail. */
export const EASY_TAIL = 15;
/** Fewer tracked rounds than this and no difficulty statement is made at all. */
export const DIFFICULTY_MIN_ROUNDS = 3;

export type DifficultyTail =
  | { tail: 'hard'; /** Share of courses this one is harder than. */ pct: number }
  | { tail: 'easy'; /** Share of courses this one is easier than. */ pct: number }
  | null;

/**
 * The tail this course sits in, or null when the sample is too thin, the
 * percentile is absent, or the course sits mid-distribution and therefore has
 * nothing to say.
 */
export function courseDifficultyTail(ctx: PostCourseContext | null | undefined): DifficultyTail {
  const rounds = ctx?.rounds_tracked ?? 0;
  const pct = ctx?.harder_than_pct;
  if (!ctx || rounds < DIFFICULTY_MIN_ROUNDS || pct == null) return null;
  if (pct >= HARD_TAIL) return { tail: 'hard', pct: Math.min(99, Math.max(1, pct)) };
  if (pct <= EASY_TAIL) return { tail: 'easy', pct: Math.min(99, Math.max(1, 100 - pct)) };
  return null;
}
