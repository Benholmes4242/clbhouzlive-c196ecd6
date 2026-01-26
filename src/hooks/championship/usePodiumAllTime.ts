import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AllTimePodiumEntry, PodiumScope } from '@/types/podium';

interface UsePodiumAllTimeParams {
  scope: PodiumScope;
  clubId?: string | null;
  currentUserId?: string;
  enabled?: boolean;
}

export function usePodiumAllTime({
  scope,
  clubId,
  currentUserId,
  enabled = true,
}: UsePodiumAllTimeParams) {
  return useQuery({
    queryKey: ['podium', 'all_time', scope, clubId, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_podium_all_time', {
        p_scope: scope,
        p_current_user_id: currentUserId ?? null,
        p_club_id: scope === 'club' ? clubId : null,
      });

      if (error) {
        console.error('Error fetching all-time podium:', error);
        throw error;
      }

      return (data ?? []) as unknown as AllTimePodiumEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes (less volatile)
  });
}
