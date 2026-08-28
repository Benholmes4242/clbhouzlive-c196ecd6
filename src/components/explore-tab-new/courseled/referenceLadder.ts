import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { MyCourseBestRow } from '@/features/tourhub/hooks/useMyCourseBests';

/**
 * THE REFERENCE LADDER, ONE IMPLEMENTATION (BRIEF_DISCOVER_HERO_PARITY §2.4).
 *
 * The round cards and the Discover hero show the SAME round and must print the
 * SAME reference line, so the ladder lives here and both callers consume it.
 * Two copies would drift, and the tie case in tier (b) is exactly the sort of
 * thing that drifts.
 *
 * ORDER — first that resolves, nothing if none do:
 *   (b) "{n} better than your best here"   own round that BEAT the previous best
 *   (a) "Your best here is {n}"            own round that did not
 *   (c) SKIPPED: get_my_course_bests returns no mean, and a fortnight average
 *       beside an all-time rounds_here would be two histories in one sentence.
 *   (d) "{n} better than the field that day"  any round, needs a field.
 *
 * GATES, UNCHANGED FROM THE CARDS:
 *   is_self for every personal tier; rounds_here >= 4 (it counts the displayed
 *   round); second_best_gross STRICTLY greater than gross for (b), so an equalled
 *   best falls through rather than printing "0 better than your best here".
 *
 * THE HERO CALLS THIS WITH ONE ROW. Tier (d) needs at least FIELD_GATE rounds in
 * the same course/day group, so a single-row call simply cannot reach it — which
 * is correct: the hero holds no field and must never fabricate a comparison.
 */

export type ReferenceT = (
  key: string,
  fallback: string,
  vars?: Record<string, unknown>,
) => string;

/** Tier (d) needs a field: fewer than this in a course/day group is not one. */
export const FIELD_GATE = 3;

/** Personal tiers need a history. rounds_here includes the displayed round. */
export const PERSONAL_ROUNDS_FLOOR = 4;

export function buildReferenceLadder(
  rows: readonly CircleRoundRow[],
  myBests: Map<string, MyCourseBestRow>,
  t: ReferenceT,
): Map<string, string> {
  const out = new Map<string, string>();

  /* (b) then (a), own rounds only. Written FIRST so the field tier below can
     never overwrite a personal one — the ladder takes the first that resolves. */
  for (const r of rows) {
    if (!r.is_self || !r.course_id || r.gross == null) continue;
    const mine = myBests.get(r.course_id);
    const bestGross = mine?.best_gross;
    const roundsHere = mine?.rounds_here ?? 0;
    if (bestGross == null || roundsHere < PERSONAL_ROUNDS_FLOOR) continue;

    // (b) the strictly-better case, tested first.
    if (
      r.gross === bestGross &&
      mine?.second_best_gross != null &&
      mine.second_best_gross > r.gross
    ) {
      out.set(
        r.round_id,
        t(
          'discover.golfThisWeek.reference.betterThanBest',
          '{{count}} better than your best here',
          { count: mine.second_best_gross - r.gross },
        ),
      );
      continue;
    }
    if (r.gross > bestGross) {
      out.set(
        r.round_id,
        t('discover.golfThisWeek.reference.yourBest', 'Your best here is {{count}}', {
          count: bestGross,
        }),
      );
    }
    // gross === bestGross with no positive margin: a tied best — fall through.
  }

  /* (d) the field that day. */
  const groups = new Map<string, CircleRoundRow[]>();
  for (const r of rows) {
    if (!r.course_id || r.gross == null || r.course_par == null) continue;
    const key = `${r.course_id}|${String(r.play_date ?? '').slice(0, 10)}`;
    const list = groups.get(key);
    if (list) list.push(r);
    else groups.set(key, [r]);
  }

  for (const list of groups.values()) {
    if (list.length < FIELD_GATE) continue;
    const toPars = list.map((r) => (r.gross as number) - (r.course_par as number));
    const avg = toPars.reduce((a, b) => a + b, 0) / toPars.length;
    list.forEach((r, i) => {
      if (out.has(r.round_id)) return; // a personal tier already won the ladder
      const better = avg - toPars[i];
      if (better < 1) return;
      out.set(
        r.round_id,
        t(
          'discover.golfThisWeek.reference.fieldDay',
          '{{count}} better than the field that day',
          { count: Math.round(better) },
        ),
      );
    });
  }

  return out;
}

export default buildReferenceLadder;
