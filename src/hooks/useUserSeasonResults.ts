import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserSeasonResult {
  id: string;
  user_id: string;
  season_id: string;
  final_xp: number;
  final_rank: number;
  reward_tier: string;
  badge_icon: string | null;
  created_at: string;
  season?: {
    id: string;
    name: string;
    slug: string;
    ends_at: string;
  };
}

export function useUserSeasonResults(userId?: string) {
  return useQuery({
    queryKey: ['user-season-results', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserSeasonResult[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_season_results' as any)
        .select(`
          *,
          seasons:season_id (
            id,
            name,
            slug,
            ends_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        season_id: row.season_id,
        final_xp: row.final_xp,
        final_rank: row.final_rank,
        reward_tier: row.reward_tier,
        badge_icon: row.badge_icon,
        created_at: row.created_at,
        season: row.seasons ? {
          id: row.seasons.id,
          name: row.seasons.name,
          slug: row.seasons.slug,
          ends_at: row.seasons.ends_at,
        } : undefined,
      }));
    },
    staleTime: 60_000,
  });
}
