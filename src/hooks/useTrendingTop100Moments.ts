import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TrendingTop100Moment = {
  post_id: string;
  course_id: string;
  course_name: string;
  list_slug: string;
  list_rank: number | null;
  short_label: string | null;
  engagement_score: number;
  created_at: string;
  content: string | null;
};

export function useTrendingTop100Moments(limit = 12, daysWindow = 7) {
  return useQuery({
    queryKey: ['top100-trending-moments', limit, daysWindow],
    queryFn: async (): Promise<TrendingTop100Moment[]> => {
      const args = { limit_param: limit, days_param: daysWindow };
      const { data, error } = await supabase.rpc('get_trending_top100_moments', args);

      if (error) {
        console.error('[RPC] get_trending_top100_moments failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          args,
        });
        // Return empty array instead of throwing to prevent UI breaks
        return [];
      }

      return (data ?? []) as TrendingTop100Moment[];
    },
    staleTime: 60_000,
    retry: false, // Don't retry broken RPCs
  });
}
