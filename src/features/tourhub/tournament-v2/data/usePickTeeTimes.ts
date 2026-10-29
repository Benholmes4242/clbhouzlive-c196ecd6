/**
 * usePickTeeTimes — the stored tee sheet's tee time for each pick in one
 * round. One query per tournament+round for all picks, keyed on
 * sr_tee_time_players.player_id, which is sr_players.id — the same id
 * AITopContender.playerId carries (useAIPredictions enriches picks by
 * sr_players.id). A failed or empty read yields an empty map, so pick cards
 * render exactly as they do without tee times.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePickTeeTimes(
  tournamentId: string | null | undefined,
  round: number,
  playerIds: string[],
  options?: { enabled?: boolean },
) {
  const ids = [...new Set(playerIds.filter(Boolean))].sort();
  return useQuery<Map<string, string>>({
    queryKey: ['tournament-v2', 'pick-tee-times', tournamentId, round, ids.join(',')],
    enabled: !!tournamentId && ids.length > 0 && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tee_times')
        .select('tee_time, players:sr_tee_time_players!inner(player_id)')
        .eq('tournament_id', tournamentId as string)
        .eq('round_number', round)
        .in('sr_tee_time_players.player_id', ids);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of (data ?? []) as Array<{ tee_time: string | null; players: Array<{ player_id: string | null }> | null }>) {
        if (!row.tee_time) continue;
        for (const p of row.players ?? []) if (p.player_id && !map.has(String(p.player_id))) map.set(String(p.player_id), row.tee_time);
      }
      return map;
    },
  });
}
