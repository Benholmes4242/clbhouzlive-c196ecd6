import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';

/**
 * CS1 — useCourseLately: get_course_lately(p_course_id, p_limit, p_offset),
 * ten a page, with useRecentRounds' paging rules. The RPC owns visibility,
 * order and the summary; never filter or re-sort here. Signed-out viewers get
 * nothing back, so the hook is disabled without a user.
 *
 * The RPC is newer than the generated types: (supabase.rpc as any) plus a
 * typed mapper, as useFeatsWindow does.
 */
export const LATELY_PAGE = 10;

export interface LatelyRound extends StandoutRound {
  in_circle: boolean;
  total_count: number;
  golfers: number;
  window_avg_topar: number | null;
  best_gross: number | null;
  best_gross_date: string | null;
}

const num = (v: unknown): number | null => (v == null ? null : Number(v));

export function mapLatelyRow(row: Record<string, unknown>): LatelyRound {
  const r = row as unknown as LatelyRound;
  return {
    ...r,
    pos: Number(r.pos ?? 0),
    prior_n: Number(r.prior_n ?? 0),
    gross_score: num(r.gross_score),
    course_par: num(r.course_par),
    net_score: num(r.net_score),
    course_handicap: num(r.course_handicap),
    avg_topar: num(r.avg_topar),
    best_topar: num(r.best_topar),
    delta: num(r.delta),
    in_circle: r.in_circle === true,
    total_count: Number(r.total_count ?? 0),
    golfers: Number(r.golfers ?? 0),
    window_avg_topar: num(r.window_avg_topar),
    best_gross: num(r.best_gross),
    best_gross_date: r.best_gross_date ?? null,
  };
}

export function useCourseLately(courseId: string | undefined, userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['course', 'lately', courseId, userId],
    enabled: !!courseId && !!userId,
    staleTime: 60_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await (supabase.rpc as any)('get_course_lately', {
        p_course_id: courseId,
        p_limit: LATELY_PAGE,
        p_offset: pageParam,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapLatelyRow);
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length === 0) return undefined;
      const loaded = pages.reduce((n, page) => n + page.length, 0);
      const total = pages[0]?.[0]?.total_count ?? loaded;
      return loaded < total ? loaded : undefined;
    },
  });
}
