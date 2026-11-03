/** Viewer-keyed RPC authority for circle rank. Board cache updates drive live
 * refresh; no independent polling and no client-side follow/privacy inference. */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { getGuestUser } from '@/features/guest/guestGateStore';

export interface TournamentCircleRank { circle_pickers: number; ahead: number | null; level: number | null }
export function useTournamentCircleRank(tournamentId: string, live = false) {
  const { user } = useSupabaseSession();
  const client = useQueryClient();
  const enabled = Boolean(tournamentId && user && !user.is_anonymous && !getGuestUser());
  const query = useQuery({
    queryKey: ['tourhub', 'tournament-circle-rank', tournamentId, user?.id],
    enabled, staleTime: 0, refetchOnMount: 'always' as const,
    queryFn: async (): Promise<TournamentCircleRank | null> => {
      const { data, error } = await supabase.rpc('get_tournament_circle_rank', { p_tournament_id: tournamentId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const { refetch } = query;
  useEffect(() => {
    if (!enabled || !live) return;
    return client.getQueryCache().subscribe(event => {
      const key = event.query.queryKey;
      if (event.type === 'updated' && event.action.type === 'success'
        && key[0] === 'tourhub' && key[1] === 'leaderboard' && key[2] === tournamentId) void refetch();
    });
  }, [client, tournamentId, enabled, live, refetch]);
  return query;
}