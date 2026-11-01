/** AC1: each loaded page owns one sorted-id RPC query. Viewer identity scopes
 * caches; loading and errors suppress stale figures. No table-read fallback. */
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { ActivityFeedRowV2 } from './useActivityFeedV2';

export interface ActivityRoundSummary {
  whs_score_id: string; user_id: string; course_id: string | null;
  course_name: string; gross: number; course_par: number | null;
  to_par: number; holes_played: number; hole_to_par: (number | null)[] | null;
  avg_to_par_here: number | null; other_rounds_here: number; at_viewer_club: boolean;
}
export function activityRoundId(row: Pick<ActivityFeedRowV2, 'notif_type' | 'data'>): string | null {
  const id = row.data?.whs_score_id;
  return row.notif_type === 'new_post' && row.data?.is_round === true && typeof id === 'string' && id ? id : null;
}
function options(scoreIds: string[], userId: string | undefined) {
  const ids = [...new Set(scoreIds)].filter(Boolean).sort();
  return {
    queryKey: ['activity-round-summaries', userId, ids],
    enabled: !!userId && ids.length > 0, staleTime: 60_000, retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activity_round_summaries', { p_score_ids: ids });
      if (error) throw error;
      return new Map<string, ActivityRoundSummary>((data ?? []).map(row => [row.whs_score_id, row]));
    },
  };
}
export function useActivityRoundSummaries(scoreIds: string[]): Map<string, ActivityRoundSummary> {
  const { user } = useSupabaseSession();
  const query = useQuery(options(scoreIds, user?.id));
  return query.isSuccess && !query.isFetching ? query.data : new Map();
}
export function useActivityRoundPages(pages: ActivityFeedRowV2[][]): Map<string, ActivityRoundSummary> {
  const { user } = useSupabaseSession();
  const queries = useQueries({ queries: pages.map(page => options(page.flatMap(row => {
    const id = activityRoundId(row); return id ? [id] : [];
  }), user?.id)) });
  return new Map(queries.flatMap(query => query.isSuccess && !query.isFetching ? [...query.data] : []));
}