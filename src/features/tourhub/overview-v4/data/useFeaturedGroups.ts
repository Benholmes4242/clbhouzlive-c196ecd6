/**
 * useFeaturedGroups — RPC get_featured_groups({ p_tournament_id }).
 * Polls every 60s while state === 'live'; disabled otherwise.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFeaturedGroups(tournamentId: string | undefined, opts: { live: boolean }) {
  return useQuery({
    queryKey: ['overview-v4', 'featured-groups', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;
      const { data, error } = await supabase.rpc('get_featured_groups', {
        p_tournament_id: tournamentId,
      });
      if (error) throw error;
      return data as unknown as Record<string, unknown> | null;
    },
    enabled: !!tournamentId && opts.live,
    staleTime: 30_000,
    refetchInterval: opts.live ? 60_000 : false,
  });
}
