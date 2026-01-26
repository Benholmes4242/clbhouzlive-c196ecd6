import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PodiumProximity, PodiumMode, PodiumScope } from '@/types/podium';

interface UsePodiumProximityParams {
  userId?: string;
  mode: PodiumMode;
  scope: PodiumScope;
  divisionId?: string;
  enabled?: boolean;
}

export function usePodiumProximity({
  userId,
  mode,
  scope,
  divisionId,
  enabled = true,
}: UsePodiumProximityParams) {
  return useQuery({
    queryKey: ['podium', 'proximity', userId, mode, scope, divisionId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_user_podium_proximity', {
        p_user_id: userId,
        p_time_filter: mode === 'seasonal' ? 'season' : 'all_time',
        p_scope: scope,
        p_division_id: divisionId ?? null,
      });

      if (error) {
        console.error('Error fetching podium proximity:', error);
        throw error;
      }

      return data?.[0] as PodiumProximity | null;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
