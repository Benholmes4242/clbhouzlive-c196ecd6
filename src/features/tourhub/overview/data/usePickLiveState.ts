/**
 * usePickLiveState — real leaderboard rows for a set of pick playerIds.
 * One query against sr_leaderboards; polls every 60s only when opts.live.
 * Same gating pattern as useFeaturedGroups.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PickLiveState {
  position: number | null;
  positionTied: boolean;
  today: number | null;
  thru: number | null;
  score: number | null;
  status: string | null;
}

export function usePickLiveState(
  tournamentId: string | undefined,
  playerIds: string[],
  opts: { live: boolean },
) {
  const idsKey = [...playerIds].sort().join(',');
  return useQuery({
    queryKey: ['overview', 'pick-live-state', tournamentId, idsKey],
    queryFn: async (): Promise<Map<string, PickLiveState>> => {
      if (!tournamentId || playerIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('player_id, position, position_tied, today, thru, score, status')
        .eq('tournament_id', tournamentId)
        .in('player_id', playerIds);
      if (error) throw error;
      const map = new Map<string, PickLiveState>();
      (data ?? []).forEach((row: any) => {
        map.set(row.player_id, {
          position: typeof row.position === 'number' ? row.position : row.position != null ? Number(row.position) : null,
          positionTied: !!row.position_tied,
          today: row.today != null ? Number(row.today) : null,
          thru: row.thru != null ? Number(row.thru) : null,
          score: row.score != null ? Number(row.score) : null,
          status: row.status ?? null,
        });
      });
      return map;
    },
    enabled: !!tournamentId && playerIds.length > 0,
    staleTime: 30_000,
    refetchInterval: opts.live ? 60_000 : false,
  });
}
