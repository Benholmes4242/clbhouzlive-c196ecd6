import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserSeasonXP {
  season_id: string;
  season_slug: string;
  season_name: string;
  user_id: string;
  total_xp: number;
  season_rank?: number;
}

export function useUserSeasonXP(userId?: string, seasonId?: string) {
  return useQuery({
    queryKey: ['user-season-xp', userId, seasonId],
    enabled: !!userId && !!seasonId,
    queryFn: async (): Promise<UserSeasonXP | null> => {
      if (!userId || !seasonId) return null;

      const { data, error } = await supabase
        .from('season_leaderboard_view' as any)
        .select('season_id, season_slug, season_name, user_id, total_xp, season_rank')
        .eq('season_id', seasonId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // User has 0 XP this season
        const { data: season } = await supabase
          .from('seasons' as any)
          .select('id, slug, name')
          .eq('id', seasonId)
          .maybeSingle();

        if (!season) return null;

        return {
          season_id: (season as any).id,
          season_slug: (season as any).slug,
          season_name: (season as any).name,
          user_id: userId,
          total_xp: 0,
        };
      }

      return data as unknown as UserSeasonXP;
    },
    staleTime: 30_000,
  });
}
