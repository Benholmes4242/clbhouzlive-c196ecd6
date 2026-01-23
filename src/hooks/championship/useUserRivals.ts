import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRival } from '@/types/championship';

export function useUserRivals(userId?: string, limit = 5) {
  return useQuery({
    queryKey: ['user-rivals', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<UserRival[]> => {
      if (!userId) return [];

      // Get rivals from user_rivals table - using correct column name 'rival_id' (not 'rival_user_id')
      // and avoiding the FK hint since PostgREST can't find it
      const { data: rivalsData, error: rivalsError } = await supabase
        .from('user_rivals')
        .select(`
          rival_id,
          times_overtaken,
          times_been_overtaken,
          current_gap,
          is_active
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('times_overtaken', { ascending: false })
        .limit(limit);

      if (rivalsError) throw rivalsError;
      if (!rivalsData || rivalsData.length === 0) return [];

      // Get rival profiles separately
      const rivalIds = rivalsData.map((r) => r.rival_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', rivalIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.id, p])
      );

      // Get the active season
      const { data: seasonData } = await supabase.rpc('get_active_season');
      const seasonId = (seasonData as any)?.[0]?.id;
      
      if (!seasonId) {
        // Return rivals without season stats
        return rivalsData.map((r): UserRival => {
          const profile = profilesMap.get(r.rival_id);
          return {
            rival_user_id: r.rival_id,
            display_name: profile?.display_name || 'Unknown',
            avatar_url: profile?.profile_photo_url || null,
            courses_this_season: 0,
            current_rank: 0,
            gap: r.current_gap || 0,
            times_overtaken: r.times_overtaken || 0,
            times_been_overtaken: r.times_been_overtaken || 0,
            relationship: (r.current_gap || 0) > 0 ? 'above' : 'below',
          };
        });
      }

      // Get season stats for rivals
      const { data: statsData } = await supabase
        .from('user_season_stats')
        .select('user_id, courses_logged, current_rank')
        .eq('season_id', seasonId)
        .in('user_id', rivalIds);

      const statsMap = new Map(
        (statsData || []).map((s) => [s.user_id, s])
      );

      return rivalsData.map((r): UserRival => {
        const stats = statsMap.get(r.rival_id);
        const profile = profilesMap.get(r.rival_id);
        
        return {
          rival_user_id: r.rival_id,
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.profile_photo_url || null,
          courses_this_season: stats?.courses_logged || 0,
          current_rank: stats?.current_rank || 0,
          gap: r.current_gap || 0,
          times_overtaken: r.times_overtaken || 0,
          times_been_overtaken: r.times_been_overtaken || 0,
          relationship: (r.current_gap || 0) > 0 ? 'above' : 'below',
        };
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
