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
 * ROUNDS PLAYED COMES FROM get_course_familiarity (gam_round_stats) ONLY.
 * gam_member_unit_bests.attempts counts rounds that produced a unit and reads
 * 1-5% short of the true count — never use it for a rounds figure.
 */
export interface LegendHit { rank: number; value: number }

export function standingFor(
  legend: LegendHit | undefined,
  rounds: number | undefined,
): Standing | null {
  if (legend && legend.rank === 1) return { kind: 'record', value: legend.value };
  if (legend && legend.rank >= 1 && legend.rank <= 10) return { kind: 'top_ten' };
  if (rounds != null) {
    if (rounds > 1) return { kind: 'played', n: rounds };
    if (rounds === 1) return { kind: 'first' };
  }
  return null;
}

/** Familiarity RPC is bounded at 50 ids per call. */
export const FAMILIARITY_BATCH = 50;

export function chunkIds(ids: string[], size = FAMILIARITY_BATCH): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/** A failed or absent familiarity read yields an empty map: the rounds tiers go silent, nothing else. */
export function familiarityMap(
  results: Array<{ data: unknown; error: unknown }>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const res of results) {
    if (res.error || !Array.isArray(res.data)) continue;
    for (const r of res.data as Array<{ user_id: string; rounds: number | string | null }>) {
      const n = r.rounds == null ? NaN : Number(r.rounds);
      if (r.user_id && Number.isFinite(n)) out.set(r.user_id, n);
    }
  }
  return out;
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
