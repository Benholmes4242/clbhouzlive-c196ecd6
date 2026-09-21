import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE RECORD BOOK, READ AND NEVER RECOMPUTED (BRIEF_EXPLORE_MAGAZINE §3e).
 *
 * Who holds a course record is answered by ONE place: gam_course_legends, the
 * row the evaluator writes, with is_current true, category
 * 'lowest_gross_all_time' and ranks 1-2. This file reads those rows. It does not
 * scan rounds and decide who is top, because that recomputation is the
 * record-book drift the app has already been bitten by.
 *
 * WHY THE ROUND IS MATCHED BY IDENTITY, NOT BY ID: the brief expected
 * gam_course_legends.trigger_whs_score_id to name the round that attained the
 * record. Measured on production, that column is NULL on 255 of 255 current
 * rank-1 gross legends, and gam_legend_pulse_events carries no score column at
 * all. So a round is recognised as the record-taking round when the CURRENT
 * record row for the same (course, member) has the same date and the same
 * gross. 253 of 255 records match exactly one round that way; the 2 that match
 * two rounds (same day, same gross) are ambiguous and are reported as no
 * record at all rather than pinned to a guess.
 *
 * RECORD_LOST COMES FROM THE VIEWER'S OWN POST BOX. gam_legend_pulse_events has
 * RLS `user_id = auth.uid()` and its only kinds are 'win' and 'threat', so the
 * viewer cannot read the win row that dispossessed them and there is no 'lost'
 * kind to read. The dispossession IS recorded, addressed to the viewer, as a
 * `notifications` row of type 'legend_lost' written by the SQL trigger
 * gam_legend_pulse_emit; its data carries course_id, category and taken_by.
 * That is the signal used here, and it is the same one Activity shows.
 */

export const RECORD_CATEGORY = 'lowest_gross_all_time';

export interface RecordHolder {
  course_id: string;
  user_id: string;
  /** The record gross. */
  value: number;
  /** The previous record, now sitting at rank 2. Null until another score exists. */
  runner_up_value: number | null;
  /** Date the record was attained (a date, venue-agnostic). */
  attained_on: string | null;
}

export interface CourseRecordSignal {
  /** course_id -> the CURRENT rank-1 lowest-gross holder. */
  holders: Map<string, RecordHolder>;
  /** `${course_id}:${taken_by}` for records the VIEWER lost to that member. */
  lostToViewer: Set<string>;
  isFetched: boolean;
}

export function courseRecordMargin(holder: RecordHolder | null | undefined): number | null {
  return holder?.runner_up_value == null ? null : holder.runner_up_value - holder.value;
}

const EMPTY: CourseRecordSignal = { holders: new Map(), lostToViewer: new Set(), isFetched: true };

interface LegendRow {
  course_id: string | null;
  user_id: string | null;
  value: number | string | null;
  attained_at: string | null;
  rank: number | null;
}

export function recordHoldersFromRows(rows: LegendRow[]): Map<string, RecordHolder> {
  const grouped = new Map<string, { leaders: LegendRow[]; runners: LegendRow[] }>();
  for (const row of rows) {
    if (!row.course_id || row.value == null || (row.rank !== 1 && row.rank !== 2)) continue;
    const course = grouped.get(row.course_id) ?? { leaders: [], runners: [] };
    if (row.rank === 1) course.leaders.push(row);
    else course.runners.push(row);
    grouped.set(row.course_id, course);
  }

  const out = new Map<string, RecordHolder>();
  for (const [courseId, course] of grouped) {
    /* The existing safety rule survives: an absent or ambiguous rank 1 names no
       holder. A missing/ambiguous rank 2 names no margin rather than inventing 0. */
    if (course.leaders.length !== 1) continue;
    const leader = course.leaders[0];
    if (!leader.user_id) continue;
    const runner = course.runners.length === 1 ? course.runners[0] : null;
    out.set(courseId, {
      course_id: courseId,
      user_id: leader.user_id,
      value: Number(leader.value),
      runner_up_value: runner?.value == null ? null : Number(runner.value),
      attained_on: leader.attained_at ? leader.attained_at.slice(0, 10) : null,
    });
  }
  return out;
}

interface LostRow {
  data: { course_id?: string | null; category?: string | null; taken_by?: string | null } | null;
}

export function useCourseRecordSignal(
  viewerId: string | undefined,
  courseIds: string[],
): CourseRecordSignal {
  /* A STABLE KEY: the same set of courses in a different order is the same
     question, so it must not be a second cache entry or a second read. */
  const ids = useMemo(() => Array.from(new Set(courseIds.filter(Boolean))).sort(), [courseIds]);

  const holders = useQuery<Map<string, RecordHolder>>({
    queryKey: ['explore-magazine', 'record-holders', ids.join('|')],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gam_course_legends' as never)
        .select('course_id, user_id, value, attained_at, rank')
        .eq('is_current', true)
        .eq('category', RECORD_CATEGORY)
        .in('rank', [1, 2])
        .in('course_id', ids);
      if (error) throw error;
      return recordHoldersFromRows((data ?? []) as unknown as LegendRow[]);
    },
  });

  const lost = useQuery<Set<string>>({
    queryKey: ['explore-magazine', 'records-lost', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', viewerId as string)
        .eq('type', 'legend_lost')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const out = new Set<string>();
      for (const row of ((data ?? []) as unknown as LostRow[])) {
        const payload = row.data ?? null;
        if (!payload || payload.category !== RECORD_CATEGORY) continue;
        if (payload.course_id && payload.taken_by) out.add(`${payload.course_id}:${payload.taken_by}`);
      }
      return out;
    },
  });

  return useMemo(() => {
    if (ids.length === 0 && !viewerId) return EMPTY;
    return {
      holders: holders.data ?? new Map(),
      lostToViewer: lost.data ?? new Set(),
      /* READINESS IS isFetched (§0). A disabled read is ready and empty; an
         unresolved read leaves the maps empty, which draws no record kind at
         all rather than a wrong one. */
      isFetched: (ids.length === 0 || holders.isFetched) && (!viewerId || lost.isFetched),
    };
  }, [ids.length, viewerId, holders.data, holders.isFetched, lost.data, lost.isFetched]);
}
