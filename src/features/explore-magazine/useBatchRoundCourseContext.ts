import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { RoundCourseContext } from '@/lib/whs/useRoundCourseContext';

/** get_round_course_context_batch returns NO ROWS for an array longer than 60
 *  (a deliberate server guard). The feed must never send more than this in one
 *  call: longer id lists are sliced into requests of at most this size. */
export const COURSE_CONTEXT_BATCH_MAX = 60;

export function sliceForCourseContextBatch(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += COURSE_CONTEXT_BATCH_MAX) out.push(ids.slice(i, i + COURSE_CONTEXT_BATCH_MAX));
  return out;
}

/**
 * ONE READ PER FEED WINDOW of the member's own history at each round's course,
 * via get_round_course_context_batch (a LATERAL wrapper over the single-id
 * function, so figures are identical). Wired exactly like useBatchRoundMedals:
 * call once in the feed, cards receive rows as props, never fetch.
 *
 * The single-id useRoundCourseContext stays for CardScorecardSheet — do not
 * route it through this batch.
 *
 * A missing row means no context: the card shows its em dash.
 */
export function useBatchRoundCourseContext(scoreIds: Array<string | null | undefined>) {
  const ids = useMemo(
    () => Array.from(new Set(scoreIds.filter((id): id is string => !!id))).sort(),
    [scoreIds],
  );
  const query = useQuery({
    queryKey: ['round-course-context-batch', ids],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, RoundCourseContext>> => {
      const map = new Map<string, RoundCourseContext>();
      for (const slice of sliceForCourseContextBatch(ids)) {
        const { data, error } = await supabase.rpc('get_round_course_context_batch', { p_ids: slice });
        if (error) throw error;
        for (const row of (data ?? []) as Array<RoundCourseContext & { whs_score_id: string | null }>) {
          if (row.whs_score_id) map.set(row.whs_score_id, row);
        }
      }
      return map;
    },
  });
  return { contexts: query.data, isSuccess: query.isSuccess, isFetched: query.isFetched };
}
