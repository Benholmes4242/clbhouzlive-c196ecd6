import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SeasonalPodiumEntry, PodiumScope } from '@/types/podium';

interface UsePodiumSeasonalParams {
  scope: PodiumScope;
  divisionId?: string;
  currentUserId?: string;
  enabled?: boolean;
}

export function usePodiumSeasonal({
  scope,
  divisionId,
  currentUserId,
  enabled = true,
}: UsePodiumSeasonalParams) {
  return useQuery({
    queryKey: ['podium', 'seasonal', scope, divisionId, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_podium_seasonal', {
        p_scope: scope,
        p_division_id: divisionId ?? null,
        p_current_user_id: currentUserId ?? null,
      });

      if (error) {
        console.error('Error fetching seasonal podium:', error);
        throw error;
      }

      return (data ?? []) as SeasonalPodiumEntry[];
    },
    enabled: enabled && scope !== 'nearby',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
