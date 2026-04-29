import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChampionshipDispatch {
  id: string;
  kind:
    | 'rank_crossing'
    | 'division_promotion'
    | 'division_relegation'
    | 'biggest_climber'
    | 'leader_change'
    | 'milestone_courses';
  body: string;
  subject_user_id: string | null;
  subject_display_name: string | null;
  surfaced_at: string;
}

interface UseChampionshipDispatchesArgs {
  limit?: number;
  enabled?: boolean;
}

/**
 * Fetches the latest unexpired wire dispatches for the Top 100 ticker.
 * Polls every 60s. Returns up to `limit` (default 10), already filtered
 * server-side to unexpired entries (expires_at > now()).
 */
export function useChampionshipDispatches({
  limit = 10,
  enabled = true,
}: UseChampionshipDispatchesArgs = {}) {
  return useQuery({
    queryKey: ['championship-dispatches', limit],
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    queryFn: async (): Promise<ChampionshipDispatch[]> => {
      const { data, error } = await supabase.rpc('get_championship_dispatches', {
        p_limit: limit,
      });

      if (error) {
        console.error('[useChampionshipDispatches] fetch error', error);
        return [];
      }

      return (data ?? []) as ChampionshipDispatch[];
    },
  });
}
