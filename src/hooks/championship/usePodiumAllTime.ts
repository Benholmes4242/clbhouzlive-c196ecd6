import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AllTimePodiumEntry, PodiumScope } from '@/types/podium';

interface UsePodiumAllTimeParams {
  scope: PodiumScope;
  currentUserId?: string;
  enabled?: boolean;
}

export function usePodiumAllTime({
  scope,
  currentUserId,
  enabled = true,
}: UsePodiumAllTimeParams) {
  return useQuery({
    queryKey: ['podium', 'all_time', scope, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_podium_all_time', {
        p_scope: scope,
        p_current_user_id: currentUserId ?? null,
      });

      if (error) {
        console.error('Error fetching all-time podium:', error);
        throw error;
      }

      return (data ?? []) as AllTimePodiumEntry[];
    },
    enabled: enabled && scope !== 'nearby',
    staleTime: 1000 * 60 * 5, // 5 minutes (less volatile)
  });
}
