import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useMostPlayedThisWeek — tracked WHS rounds per course over a rolling 7 days,
 * with the delta against the prior 7 (BRIEF, section 5).
 *
 * QUERY SHAPE: one client select over gam_round_stats for the 14-day window
 * (course_id + play_date only), counted client-side for both windows. Platform
 * volume is single figures per week, so an RPC would buy nothing; if row volume
 * ever makes this heavy the aggregate belongs in a `discover_most_played` RPC
 * returning (course_id, rounds_7d, rounds_prev_7d).
 *
 * A cooling-off course shows NO delta — never a red one.
 */

export interface MostPlayedRow {
  courseId: string;
  courseName: string | null;
  count: number;
  /** Positive change vs the prior 7 days, or null when flat/negative. */
  delta: number | null;
}

const DAY = 86_400_000;

export function useMostPlayedThisWeek(limit = 25) {
  return useQuery({
    queryKey: ['courseled', 'most-played', limit],
    queryFn: async (): Promise<MostPlayedRow[]> => {
      const now = Date.now();
      const startPrev = new Date(now - 14 * DAY).toISOString().slice(0, 10);
      const startCur = new Date(now - 7 * DAY).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('gam_round_stats' as never)
        .select('course_id, course_name, play_date')
        .gte('play_date', startPrev)
        .not('course_id', 'is', null);
      if (error) throw error;

      const rows = ((data ?? []) as unknown) as Array<{
        course_id: string | null;
        course_name: string | null;
        play_date: string;
      }>;

      const cur = new Map<string, number>();
      const prev = new Map<string, number>();
      const names = new Map<string, string | null>();
      for (const r of rows) {
        if (!r.course_id) continue;
        names.set(r.course_id, r.course_name ?? names.get(r.course_id) ?? null);
        const bucket = r.play_date >= startCur ? cur : prev;
        bucket.set(r.course_id, (bucket.get(r.course_id) ?? 0) + 1);
      }

      return [...cur.entries()]
        .map(([courseId, count]) => {
          const change = count - (prev.get(courseId) ?? 0);
          return {
            courseId,
            courseName: names.get(courseId) ?? null,
            count,
            delta: change > 0 ? change : null,
          };
        })
        .sort((a, b) => b.count - a.count || (a.courseName ?? '').localeCompare(b.courseName ?? ''))
        .slice(0, limit);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
