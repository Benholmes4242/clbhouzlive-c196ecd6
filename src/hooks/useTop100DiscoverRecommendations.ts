import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100DiscoverMoment = {
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

export function useTop100DiscoverRecommendations(limit = 12) {
  return useQuery({
    queryKey: ['top100-discover-recs', limit],
    queryFn: async (): Promise<Top100DiscoverMoment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const args = { target_user_id: user.id, limit_param: limit };
      const { data, error } = await supabase.rpc('get_top100_discover_recommendations', args);

      if (error) {
        console.error('[RPC] get_top100_discover_recommendations failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          args,
        });
        // Return empty array instead of throwing to prevent UI breaks
        return [];
      }

      return (data ?? []) as Top100DiscoverMoment[];
    },
    staleTime: 60_000,
    retry: false, // Don't retry broken RPCs
  });
}
