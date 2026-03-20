import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { UserHandicapStatus } from '@/types/leaderboards';

interface UseUserHandicapStatusOptions {
  userId?: string | null;
  enabled?: boolean;
}

export function useUserHandicapStatus(options: UseUserHandicapStatusOptions = {}) {
  const { user } = useSupabaseSession();
  const { userId = user?.id, enabled = true } = options;

  return useQuery({
    queryKey: ['user-handicap-status', userId],
    queryFn: async (): Promise<UserHandicapStatus | null> => {
      if (!userId) return null;

      // Fetch user's current handicap and visibility
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('eg_handicap_index, show_handicap')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user handicap status:', profileError);
        throw profileError;
      }

      if (!profile) return null;

      // If user has no handicap, return early
      if (profile.eg_handicap_index === null) {
        return {
          current_handicap: null,
          handicap_rank: null,
          improvement_30d: null,
          improvement_season: null,
          show_handicap: profile.show_handicap ?? false,
        };
      }

      // Calculate rank among all users with public, visible handicaps
      const { count: higherCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true)
        .eq('show_handicap', true)
        .eq('show_in_handicap_leaderboards', true)
        .lt('eg_handicap_index', profile.eg_handicap_index);

      const handicapRank = (higherCount ?? 0) + 1;

      // Get 30-day improvement from handicap history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historyData } = await supabase
        .from('user_handicap_history')
        .select('handicap_value')
        .eq('user_id', userId)
        .lte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1);

      const handicap30dAgo = historyData?.[0]?.handicap_value ?? null;
      const improvement30d = handicap30dAgo !== null 
        ? handicap30dAgo - profile.eg_handicap_index 
        : null;

      // Get season start handicap for season improvement
      const { data: seasonData } = await supabase
        .from('championship_seasons')
        .select('id, start_date')
        .eq('status', 'active')
        .limit(1)
        .single();

      let improvementSeason: number | null = null;

      if (seasonData?.start_date) {
        const { data: seasonStartHistory } = await supabase
          .from('user_handicap_history')
          .select('handicap_value')
          .eq('user_id', userId)
          .lte('recorded_at', seasonData.start_date)
          .order('recorded_at', { ascending: false })
          .limit(1);

        const seasonStartHandicap = seasonStartHistory?.[0]?.handicap_value ?? null;
        improvementSeason = seasonStartHandicap !== null
          ? seasonStartHandicap - profile.eg_handicap_index
          : null;
      }

      return {
        current_handicap: profile.eg_handicap_index,
        handicap_rank: handicapRank,
        improvement_30d: improvement30d,
        improvement_season: improvementSeason,
        show_handicap: profile.show_handicap ?? false,
      };
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
