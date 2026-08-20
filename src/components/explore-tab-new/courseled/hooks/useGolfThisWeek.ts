import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useUserJourneyCourses } from '@/hooks/useUserJourneyCourses';
import { usePlayedUnratedCourses } from '@/hooks/usePlayedUnratedCourses';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

/**
 * GOLF THIS WEEK — the data layer (BRIEF_GOLF_THIS_WEEK §1, extended by
 * BRIEF_MERGE_CIRCLE_AND_GOLF_THIS_WEEK §S2).
 *
 * ONE READ, NO FEAT THRESHOLD, SEVEN DAYS FOR EVERY SCOPE. Your Circle and Golf
 * this week were one section shown twice; they are now one rail whose SCOPE is a
 * pill. The scope is answered by the DATABASE — Top 100 and Played are course
 * allow-lists passed into the query, never a client-side discard of rows the app
 * already paid to enrich.
 *
 * The read is `useCircleLatestRounds`, so the whole existing enrichment pipeline
 * — nines, course records, per-course history, feats, index movement — is shared
 * rather than duplicated. RLS decides visibility.
 */

/** Seven days. "This week" is the section's entire claim — do not widen it (§F). */
export const GOLF_WEEK_DAYS = 7;

/** The rail shows ten (§5.1); the fetch must cover the TRUE total for the count. */
export const GOLF_WEEK_FETCH = 60;
export const GOLF_WEEK_RAIL_CAP = 10;

/** The five scopes (§S2.1). Your Circle leads and is the default. */
export type WeekScope = 'circle' | 'suggested' | 'top_100' | 'played' | 'worldwide';
export const WEEK_SCOPES: WeekScope[] = [
  'circle',
  'suggested',
  'top_100',
  'played',
  'worldwide',
];
export const DEFAULT_WEEK_SCOPE: WeekScope = 'circle';

/** Every course id on an ACTIVE published Top 100 list. Cached for the session. */
export function useTop100CourseIds() {
  return useQuery({
    queryKey: ['courseled', 'top100-course-ids'],
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, top100_lists!inner(is_active)')
        .eq('top100_lists.is_active', true);
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.course_id as string))];
    },
  });
}

/** Courses this member has played: rated rounds UNION tracked-but-unrated. */
export function usePlayedCourseIds(userId: string | undefined) {
  const journey = useUserJourneyCourses(userId);
  const { courses: playedUnrated, loading } = usePlayedUnratedCourses(userId);
  const ids = useMemo(() => {
    const s = new Set<string>();
    for (const c of journey.data?.played ?? []) if (c.id) s.add(c.id);
    for (const c of playedUnrated) if (c.course_id) s.add(c.course_id);
    return [...s];
  }, [journey.data, playedUnrated]);
  return { ids, ready: !journey.isPending && !loading };
}

/**
 * THE SCOPE'S COURSE ALLOW-LIST. `null` = no course predicate (Circle,
 * Suggested, Worldwide). `undefined` = not resolved yet, so the rounds query must
 * wait rather than run unfiltered and flash a wrong set.
 */
export function useWeekScopeCourses(userId: string | undefined, scope: WeekScope) {
  const top100 = useTop100CourseIds();
  const played = usePlayedCourseIds(userId);

  if (scope === 'top_100') {
    return { courseIds: top100.data ?? undefined, ready: !top100.isPending };
  }
  if (scope === 'played') {
    return { courseIds: played.ready ? played.ids : undefined, ready: played.ready };
  }
  return { courseIds: null as string[] | null, ready: true };
}

/**
 * THE ROUNDS FOR A SCOPE. Seven days in every case; the per-member cap is off,
 * because a section that says "16 rounds" must show sixteen rounds (§S1.4).
 */
export function useGolfThisWeek(
  userId: string | undefined,
  scope: WeekScope = DEFAULT_WEEK_SCOPE,
  courseIds: string[] | null | undefined = null,
) {
  const hookScope =
    scope === 'circle' ? 'circle' : scope === 'suggested' ? 'suggested' : 'everyone';
  const query = useCircleLatestRounds(courseIds === undefined ? undefined : userId, {
    scope: hookScope,
    windowDays: GOLF_WEEK_DAYS,
    limit: GOLF_WEEK_FETCH,
    includeSuggested: scope === 'suggested',
    oneRoundPerMember: false,
    courseIds: courseIds ?? null,
  });
  return query;
}

/**
 * THE ORDER (§3). Filtering happens in SQL, so this only ORDERS:
 *   1. the viewer's own round, always first
 *   2. rounds at courses the viewer has never played (widest spread)
 *   3. recency
 * then a single adjacency pass so the same course never renders twice in a row.
 */
export function orderForWeek(
  rows: readonly CircleRoundRow[],
  playedIds: ReadonlySet<string>,
): CircleRoundRow[] {
  const byRecency = (a: CircleRoundRow, b: CircleRoundRow) =>
    String(b.play_date).localeCompare(String(a.play_date));

  const ranked = [...rows].sort((a, b) => {
    if (a.is_self !== b.is_self) return a.is_self ? -1 : 1;
    const aNew = !a.course_id || !playedIds.has(a.course_id);
    const bNew = !b.course_id || !playedIds.has(b.course_id);
    if (aNew !== bNew) return aNew ? -1 : 1;
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
       because the caller's array is scope-ordered rather than date-ordered. */
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
