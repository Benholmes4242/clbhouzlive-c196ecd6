import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeason } from './useCurrentSeason';

export function useSeasonRecap(userId?: string) {
  const { data: currentSeason } = useCurrentSeason();

  return useQuery({
    queryKey: ['season-recap', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      // Get the most recently ended season
      const { data: endedSeasons, error: seasonsError } = await supabase
        .from('seasons' as any)
        .select('*')
        .lt('ends_at', new Date().toISOString())
        .eq('processing_flag', true)
        .order('ends_at', { ascending: false })
        .limit(1);

      if (seasonsError || !endedSeasons || endedSeasons.length === 0) {
        return null;
      }

      const endedSeason = endedSeasons[0] as any;

      // Check if user has already seen this recap
      const { data: seenRecap } = await supabase
        .from('user_seen_season_recaps' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('season_id', endedSeason.id)
        .maybeSingle();

      if (seenRecap) {
        return null; // Already seen
      }

      // Get user's results for this season
      const { data: result, error: resultError } = await supabase
        .from('user_season_results' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('season_id', endedSeason.id)
        .maybeSingle();

      if (resultError || !result) {
        return null;
      }

      const seasonResult = result as any;

      return {
        seasonId: endedSeason.id,
        seasonName: endedSeason.name,
        finalRank: seasonResult.final_rank,
        finalXP: seasonResult.final_xp,
        rewardTier: seasonResult.reward_tier,
      };
    },
    staleTime: 60_000,
  });
}
