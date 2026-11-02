import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { RankListSlug } from '@/features/explore-magazine/useTop100RankIndex';

/** T100: extracted career read, same key/RPC/map/100 limit. Never infer ranks
 * from activity progress: the server's career board owns position and counts. */
export interface CareerRow {
  pos: number;
  is_tie: boolean;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  home_club: string | null;
  value: number;
  field_avg: number | null;
  last_course_name: string | null;
  total_members: number;
  is_viewer: boolean | null;
}
export type CareerMetric = 'top_100_gbni_distinct' | 'top_100_worldwide_distinct' | 'top_100_europe_distinct' | 'top_100_usa_distinct' | 'birdies' | 'rounds' | 'sub_80' | 'eagles' | 'best_stableford' | 'best_score_diff';
export const TOP100_METRIC: Record<RankListSlug, CareerMetric> = {
  'gb-i': 'top_100_gbni_distinct', global: 'top_100_worldwide_distinct', europe: 'top_100_europe_distinct', usa: 'top_100_usa_distinct',
};
export function useCareerBoard(viewerId: string | undefined, metric: CareerMetric, limit: number, rpc: 'get_career_leaderboard' | 'get_year_leaderboard' = 'get_career_leaderboard', enabled = true) {
  return useQuery<CareerRow[]>({
    queryKey: ['leaderboards', rpc, viewerId ?? 'anon', metric, limit], enabled, staleTime: 5 * 60_000, retry: false,
    placeholderData: prev => prev,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: CareerRow[] | null; error: unknown }>).call(supabase, rpc, {
        p_viewer: viewerId ?? null, p_metric: metric, p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
export function useTop100Race(viewerId: string | undefined, list: RankListSlug, enabled = true) {
  return useCareerBoard(viewerId, TOP100_METRIC[list], 100, 'get_career_leaderboard', enabled && Boolean(viewerId));
}