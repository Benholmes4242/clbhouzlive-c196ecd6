import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { LowestHandicapEntry } from '@/types/leaderboards';

interface UseSimilarHandicapLeaderboardOptions {
  /** Target handicap to centre the window around (typically the user's index) */
  userHandicap: number | null | undefined;
  /** Number of rows on each side of the centre. Default 3 → returns 7 rows. */
  windowSize?: number;
  enabled?: boolean;
}

/**
 * Wraps the `get_similar_handicap_leaderboard` RPC.
 *
 * Returns a window of public players ranked by handicap, centred on the
 * target handicap value. Used by the Handicap tab "Similar (±3)" peer view.
 */
export function useSimilarHandicapLeaderboard(options: UseSimilarHandicapLeaderboardOptions) {
  const { user } = useSupabaseSession();
  const { userHandicap, windowSize = 3, enabled = true } = options;

  return useQuery({
    queryKey: ['similar-handicap-leaderboard', userHandicap, windowSize, user?.id],
    enabled: enabled && userHandicap !== null && userHandicap !== undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    queryFn: async (): Promise<LowestHandicapEntry[]> => {
      if (userHandicap === null || userHandicap === undefined) return [];

      const { data, error } = await supabase.rpc('get_similar_handicap_leaderboard', {
        p_target_handicap: userHandicap,
        p_window_size: windowSize,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('[useSimilarHandicapLeaderboard] fetch error', error);
        throw error;
      }

      return (data ?? []) as unknown as LowestHandicapEntry[];
    },
  });
}
