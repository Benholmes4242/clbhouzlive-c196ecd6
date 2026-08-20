import { useMemo } from 'react';

import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { DiscoverLensSets } from './useDiscoverLensSets';
import type { ExploreLens } from '../../hooks/useExploreLens';

/**
 * GOLF THIS WEEK — the data layer (BRIEF_GOLF_THIS_WEEK §1).
 *
 * ONE READ, NO FEAT THRESHOLD. Standout Rounds and Personal Bests both asked
 * "what was remarkable?" and, at sixteen rounds a week, threw three quarters of
 * the supply away and then padded the gap with a month of history. This asks
 * "what was played?" — every round in a seven-day window, newest first, and the
 * comparison band at the top is what supplies the "best" claim those sections
 * used to need a threshold for.
 *
 * The read is `useCircleLatestRounds` in `scope: 'everyone'`, so the whole
 * existing enrichment pipeline — nines, course records, per-course history,
 * feats, index movement — is shared rather than duplicated. RLS decides
 * visibility; there is no circle predicate.
 */

/** Seven days. "This week" is the section's entire claim — do not widen it. */
export const GOLF_WEEK_DAYS = 7;

/** The rail shows ten (§5.1); the fetch must cover the TRUE total for the count. */
export const GOLF_WEEK_FETCH = 60;
export const GOLF_WEEK_RAIL_CAP = 10;

export function useGolfThisWeek(userId: string | undefined) {
  return useCircleLatestRounds(userId, {
    scope: 'everyone',
    windowDays: GOLF_WEEK_DAYS,
    limit: GOLF_WEEK_FETCH,
    includeSuggested: false,
  });
}

/**
 * THE LENS (§3). Suggested is the DEFAULT and is an ORDERING, not a filter: a
 * member following four people must never be shown an empty section because the
 * lens they did not choose excluded everything. Top 100 and Played DO filter —
 * both are explicit questions with an honest empty answer.
 *
 * Suggested's order maximises the spread of COURSES and faces, which is the
 * variable this section is built on:
 *   1. the viewer's own round (§2.3, always first)
 *   2. rounds at courses the viewer has NEVER played
 *   3. recency
 * then a single adjacency pass so the same course never renders twice in a row.
 */
export function orderForLens(
  rows: readonly CircleRoundRow[],
  lens: ExploreLens,
  sets: DiscoverLensSets,
): CircleRoundRow[] {
  const filtered =
    lens === 'top_100'
      ? rows.filter((r) => !!r.course_id && sets.top100.has(r.course_id))
      : lens === 'played'
        ? rows.filter((r) => !!r.course_id && sets.played.has(r.course_id))
        : [...rows];

  const byRecency = (a: CircleRoundRow, b: CircleRoundRow) =>
    String(b.play_date).localeCompare(String(a.play_date));

  const ranked =
    lens === 'suggested'
      ? [...filtered].sort((a, b) => {
          if (a.is_self !== b.is_self) return a.is_self ? -1 : 1;
          const aNew = !a.course_id || !sets.played.has(a.course_id);
          const bNew = !b.course_id || !sets.played.has(b.course_id);
          if (aNew !== bNew) return aNew ? -1 : 1;
          return byRecency(a, b);
        })
      : [...filtered].sort((a, b) => {
          if (a.is_self !== b.is_self) return a.is_self ? -1 : 1;
          return byRecency(a, b);
        });

  return spreadCourses(ranked);
}

/**
 * ONE PASS, NO RE-SORT: when a card's course matches the card before it, swap it
 * with the next card of a different course. Two Broadstone rounds side by side
 * repeat the same photograph, which is the exact fault this section replaced.
 */
function spreadCourses(rows: CircleRoundRow[]): CircleRoundRow[] {
  const out = [...rows];
  for (let i = 1; i < out.length; i += 1) {
    if (out[i].course_id == null || out[i].course_id !== out[i - 1].course_id) continue;
    for (let j = i + 1; j < out.length; j += 1) {
      if (out[j].course_id !== out[i - 1].course_id) {
        [out[i], out[j]] = [out[j], out[i]];
        break;
      }
    }
  }
  return out;
}

/** The header boast (§1): rounds AND courses, both computed, never hardcoded. */
export function useWeekCounts(rows: readonly CircleRoundRow[]) {
  return useMemo(() => {
    const courses = new Set<string>();
    for (const r of rows) courses.add(r.course_id ?? `name:${r.course_name ?? '?'}`);
    return { rounds: rows.length, courses: courses.size };
  }, [rows]);
}

/**
 * THE RELATIVE BAND (§1, move 2). A comparison always has a winner, so this is
 * never empty while anybody played: lowest to-par, ties broken by the lower
 * gross and then by recency. Rounds without a par are not comparable and are
 * skipped rather than guessed at.
 */
export interface WeekBest {
  row: CircleRoundRow;
  toPar: number;
}

export function bestOfWeek(rows: readonly CircleRoundRow[]): WeekBest | null {
  let best: WeekBest | null = null;
  for (const r of rows) {
    if (r.gross == null || r.course_par == null) continue;
    const toPar = r.gross - r.course_par;
    /* TIES GO TO THE MOST RECENT ROUND (BRIEF_GOLF_THIS_WEEK_BAND §2.5): lower
       to-par, then lower gross, then the later play_date — never first-seen,
       because the caller's array is lens-ordered rather than date-ordered. */
    const tie =
      !!best && toPar === best.toPar && (r.gross ?? 0) === (best.row.gross ?? 0);
    if (
      !best ||
      toPar < best.toPar ||
      (toPar === best.toPar && (r.gross ?? 0) < (best.row.gross ?? 0)) ||
      (tie &&
        String(r.play_date).localeCompare(String(best!.row.play_date)) > 0)
    ) {
      best = { row: r, toPar };
    }
  }
  return best;
}
