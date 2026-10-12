/**
 * BRIEF_COMMENTS_SHEET G.4 — a commenter's standing AT THE COURSE THIS POST IS
 * ABOUT. Highest tier only, one line maximum, and nothing at all when there is
 * no record: the line never appears to fill space.
 */
import type { CommentV2 } from '../hooks/useCommentsV2';

export type Standing =
  | { kind: 'record'; value: number }
  | { kind: 'top_ten' }
  | { kind: 'played'; n: number }
  | { kind: 'first' };

/**
 * HELD until Ben confirms that `attempts` on the round_gross row of
 * gam_member_unit_bests is rounds played at that course (brief G.4, "verify
 * before shipping the number"). It could not be checked from here, so tiers 3
 * and 4 render nothing rather than a plausible wrong figure. Flip to true once
 * confirmed; the read and the copy are already wired.
 */
export const ATTEMPTS_VERIFIED = false;

export interface LegendHit { rank: number; value: number }

export function standingFor(
  legend: LegendHit | undefined,
  attempts: number | undefined,
  attemptsVerified: boolean = ATTEMPTS_VERIFIED,
): Standing | null {
  if (legend && legend.rank === 1) return { kind: 'record', value: legend.value };
  if (legend && legend.rank >= 1 && legend.rank <= 10) return { kind: 'top_ten' };
  if (attemptsVerified && attempts != null) {
    if (attempts > 1) return { kind: 'played', n: attempts };
    if (attempts === 1) return { kind: 'first' };
  }
  return null;
}

/** Personal commenters only — a business has no rounds. */
export function standingUserId(c: Pick<CommentV2, 'actor_type' | 'actor_id' | 'user_id'>): string | null {
  if (c.actor_type === 'business') return null;
  return c.actor_id || c.user_id || null;
}

/**
 * A REPLY INHERITS NOTHING AND REPEATS NOTHING: walking the thread in render
 * order, only a commenter's FIRST appearance carries their line.
 */
export function firstAppearanceStandings(
  threads: CommentV2[],
  byUser: Map<string, Standing>,
): Map<string, Standing> {
  const out = new Map<string, Standing>();
  const seen = new Set<string>();
  const visit = (c: CommentV2) => {
    const uid = standingUserId(c);
    if (!uid || seen.has(uid)) return;
    seen.add(uid);
    const s = byUser.get(uid);
    if (s) out.set(c.id, s);
  };
  for (const t of threads) {
    visit(t);
    for (const r of t.replies) visit(r);
  }
  return out;
}
