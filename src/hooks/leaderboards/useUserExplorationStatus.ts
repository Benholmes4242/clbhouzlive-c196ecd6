import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { UserExplorationStatus } from '@/types/leaderboards';

interface UseUserExplorationStatusOptions {
  userId?: string | null;
  enabled?: boolean;
}

export function useUserExplorationStatus(options: UseUserExplorationStatusOptions = {}) {
  const { user } = useSupabaseSession();
  const { userId = user?.id, enabled = true } = options;

  return useQuery({
    queryKey: ['user-exploration-status', userId],
    queryFn: async (): Promise<UserExplorationStatus | null> => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_user_exploration_status', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error fetching user exploration status:', error);
        throw error;
      }

      // RPC returns an array, get first row
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;

      return row as UserExplorationStatus;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
