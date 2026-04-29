import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface TierUnlock {
  tier_id: string;     // 'local' | 'rover' | 'continental' | 'globetrotter' | 'worldgolfer'
  unlocked_at: string; // ISO timestamp
}

interface UseUserTierUnlocksOptions {
  userId?: string | null;
  enabled?: boolean;
}

/**
 * Returns one row per Explorer tier the user has reached, with the date
 * that tier was unlocked. Tiers not yet reached are omitted.
 *
 * Backed by the get_user_tier_unlocks RPC.
 */
export function useUserTierUnlocks(options: UseUserTierUnlocksOptions = {}) {
  const { user } = useSupabaseSession();
  const { userId = user?.id, enabled = true } = options;

  return useQuery({
    queryKey: ['user-tier-unlocks', userId],
    queryFn: async (): Promise<TierUnlock[]> => {
      if (!userId) return [];
      const { data, error } = await (supabase.rpc as any)('get_user_tier_unlocks', {
        p_user_id: userId,
      });
      if (error) {
        console.error('[useUserTierUnlocks] fetch error', error);
        return [];
      }
      return (data ?? []) as TierUnlock[];
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
