import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SeasonPassTier {
  id: string;
  user_id: string;
  season_id: string;
  tier: 'free' | 'premium';
  purchased_at: string;
}

export function useSeasonPass(userId?: string, seasonId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['season-pass', userId, seasonId],
    enabled: !!userId && !!seasonId,
    queryFn: async (): Promise<SeasonPassTier | null> => {
      if (!userId || !seasonId) return null;

      const { data, error } = await supabase
        .from('season_pass_tiers')
        .select('id, user_id, season_id, tier, purchased_at')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .maybeSingle();

      if (error) throw error;
      return data as SeasonPassTier;
    },
    staleTime: 60_000,
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!seasonId) throw new Error('Season ID required');

      const { data, error } = await supabase.functions.invoke('process-season-pass', {
        body: { seasonId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-pass', userId, seasonId] });
      queryClient.invalidateQueries({ queryKey: ['user-cosmetics', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-season-currency', userId] });
      
      toast.success('Premium Pass Activated!', {
        description: 'You now have access to premium rewards and exclusive cosmetics!',
      });
    },
    onError: (error: Error) => {
      toast.error('Upgrade Failed', {
        description: error.message,
      });
    },
  });

  return {
    hasPremiumPass: data?.tier === 'premium',
    tier: data?.tier || 'free',
    isLoading,
    upgrade: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
  };
}
