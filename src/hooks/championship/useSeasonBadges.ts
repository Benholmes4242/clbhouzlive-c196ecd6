import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SeasonBadge } from '@/types/championship';

export function useSeasonBadges(userId?: string, seasonId?: string) {
  return useQuery({
    queryKey: ['season-badges', userId, seasonId],
    enabled: !!userId,
    queryFn: async (): Promise<SeasonBadge[]> => {
      if (!userId) return [];

      let query = supabase
        .from('season_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((b: any): SeasonBadge => ({
        id: b.id,
        user_id: b.user_id,
        season_id: b.season_id,
        badge_type: b.badge_type,
        badge_key: b.badge_key,
        earned_at: b.earned_at,
        metadata: b.metadata || {},
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
