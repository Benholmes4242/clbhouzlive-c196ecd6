import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100DiscoverMoment = {
  post_id: string;
  course_id: string;
  course_name: string;
  list_slug: string;
  list_rank: number | null;
  list_short_label: string | null;
  engagement_score: number;
  created_at: string;
  thumbnail_url: string | null;
  caption: string | null;
};

export function useTop100DiscoverRecommendations(limit = 12) {
  return useQuery({
    queryKey: ['top100-discover-recs', limit],
    queryFn: async (): Promise<Top100DiscoverMoment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_top100_discover_recommendations', {
        target_user_id: user.id,
        limit_param: limit,
      });

      if (error) throw error;

      return (data ?? []) as Top100DiscoverMoment[];
    },
    staleTime: 60_000,
  });
}
