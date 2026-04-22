import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExploreMoodId } from './useExploreMood';

export interface ExploreHeroRow {
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
  filter_tier: string | null;
}

export function useExploreHero(userId: string | undefined, mood: ExploreMoodId) {
  return useQuery({
    queryKey: ['explore-hero', userId, mood],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<ExploreHeroRow | null> => {
      const { data, error } = await supabase.rpc('get_explore_hero', {
        p_user_id: userId!,
        p_mood: mood,
      } as any);
      if (error) {
        console.error('[useExploreHero] RPC error:', error);
        if (import.meta.env.DEV) throw error;
        return null;
      }
      const row = Array.isArray(data) ? data[0] : null;
      return (row as ExploreHeroRow) ?? null;
    },
  });
}
