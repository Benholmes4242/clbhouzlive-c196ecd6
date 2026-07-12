/**
 * useLivePlayerIds — ONE query for today's live-tournament leaderboard rows.
 *
 * Powers the green live dot on rows and the live sub-line
 * ({pos} · {tournamentName}). JSON-safe: plain Record<string,V> (not Map)
 * so it hydrates cleanly under react-query persistence.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LivePlayerInfo {
  position: number | null;
  positionTied: boolean | null;
  score: number | null;
  tournamentId: string;
  tournamentName: string;
}

export type LivePlayerMap = Record<string, LivePlayerInfo>;

export function useLivePlayerIds() {
  return useQuery<LivePlayerMap>({
    queryKey: ['players-v2', 'live-ids'],
    staleTime: 60_000,
    refetchInterval: 90_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          'player_id, position, position_tied, score, tournament:sr_tournaments!inner(id, name, status)',
        )
        .eq('tournament.status', 'inprogress')
        .limit(2000);
      if (error) return {};
      const map: LivePlayerMap = {};
      for (const row of (data ?? []) as any[]) {
        if (!row.player_id) continue;
        map[row.player_id] = {
          position: row.position ?? null,
          positionTied: row.position_tied ?? null,
          score: row.score ?? null,
          tournamentId: row.tournament?.id ?? '',
          tournamentName: row.tournament?.name ?? '',
        };
      }
      return map;
    },
  });
}
