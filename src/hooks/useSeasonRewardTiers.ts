import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SeasonRewardTier {
  id: string;
  season_id: string;
  tier: string;
  min_rank: number;
  max_rank: number;
  badge_icon: string | null;
  label: string;
  created_at: string;
}

export function useSeasonRewardTiers(seasonId?: string) {
  return useQuery({
    queryKey: ['season-reward-tiers', seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<SeasonRewardTier[]> => {
      if (!seasonId) return [];

      const { data, error } = await supabase
        .from('season_rewards' as any)
        .select('*')
        .eq('season_id', seasonId)
        .order('min_rank', { ascending: true });

      if (error) throw error;
      return data as unknown as SeasonRewardTier[];
    },
    staleTime: 60_000,
  });
}
