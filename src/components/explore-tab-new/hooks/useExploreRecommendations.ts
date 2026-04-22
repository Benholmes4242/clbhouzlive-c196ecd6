import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExploreMoodId } from './useExploreMood';

export interface ExploreRecRow {
  course_id: string;
  course_name: string;
  location_primary: string | null;
  location_secondary: string | null;
  hero_image_url: string | null;
  rating_avg: number | null;
  review_count: number | null;
  global_rank: number | null;
  why_ai: string | null;
  context_stats: Record<string, any> | null;
  match_label: string | null;
  filter_tier: string | null;
}

export function useExploreRecommendations(
  userId: string | undefined,
  mood: ExploreMoodId,
  limit = 4,
) {
  return useQuery({
    queryKey: ['explore-recs', userId, mood, limit],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<ExploreRecRow[]> => {
      const { data, error } = await supabase.rpc('get_explore_recommendations', {
        p_user_id: userId!,
        p_mood: mood,
        p_limit: limit,
      } as any);
      if (error) {
        console.error('[useExploreRecommendations] RPC error:', error);
        if (import.meta.env.DEV) throw error;
        return [];
      }
      return (data ?? []) as ExploreRecRow[];
    },
  });
}
