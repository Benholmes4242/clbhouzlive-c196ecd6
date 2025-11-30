import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TrendingTop100Moment = {
  post_id: string;
  course_id: string;
  course_name: string;
  list_slug: string;
  list_rank: number | null;
  engagement_score: number;
  created_at: string;
};

export function useTrendingTop100Moments(limit = 12, daysWindow = 7) {
  return useQuery({
    queryKey: ['top100-trending-moments', limit, daysWindow],
    queryFn: async (): Promise<TrendingTop100Moment[]> => {
      const { data, error } = await supabase.rpc('get_trending_top100_moments', {
        limit_param: limit,
        days_param: daysWindow,
      });

      if (error) throw error;

      return (data ?? []) as TrendingTop100Moment[];
    },
    staleTime: 60_000,
  });
}
