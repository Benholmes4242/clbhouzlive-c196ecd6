import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRival } from '@/types/championship';

export function useUserRivals(userId?: string, limit = 5) {
  return useQuery({
    queryKey: ['user-rivals', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<UserRival[]> => {
      if (!userId) return [];

      // Get rivals from user_rivals table joined with current season stats
      const { data, error } = await supabase
        .from('user_rivals')
        .select(`
          rival_user_id,
          times_overtaken,
          times_been_overtaken,
          current_gap,
          user_profiles!user_rivals_rival_user_id_fkey(
            display_name,
            profile_photo_url
          )
        `)
        .eq('user_id', userId)
        .order('times_overtaken', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get current season stats for rivals to calculate ranks
      const rivalIds = (data || []).map((r: any) => r.rival_user_id);
      
      if (rivalIds.length === 0) return [];

      // Get the active season
      const { data: seasonData } = await supabase.rpc('get_active_season');
      const seasonId = (seasonData as any)?.id;
      
      if (!seasonId) return [];

      const { data: statsData } = await supabase
        .from('user_season_stats')
        .select('user_id, courses_logged, current_rank')
        .eq('season_id', seasonId)
        .in('user_id', rivalIds);

      const statsMap = new Map(
        (statsData || []).map((s: any) => [s.user_id, s])
      );

      return (data || []).map((r: any): UserRival => {
        const stats = statsMap.get(r.rival_user_id);
        const profile = r.user_profiles;
        
        return {
          rival_user_id: r.rival_user_id,
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.profile_photo_url || null,
          courses_this_season: stats?.courses_logged || 0,
          current_rank: stats?.current_rank || 0,
          gap: r.current_gap || 0,
          times_overtaken: r.times_overtaken || 0,
          times_been_overtaken: r.times_been_overtaken || 0,
          relationship: r.current_gap > 0 ? 'above' : 'below',
        };
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
