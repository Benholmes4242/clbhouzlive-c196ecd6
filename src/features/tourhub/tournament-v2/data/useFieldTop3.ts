/**
 * useFieldTop3 — TD1 field editorial line for upcoming events.
 *
 * Distinct player count from sr_tee_time_players (all rounds), + top-3
 * world-ranked players in the field.
 *
 * FIELD JOIN:
 *   sr_tee_times[t.id=tournament] -> sr_tee_time_players.player_id
 *     (distinct) -> sr_world_rankings.player_id (order rank asc, limit 3)
 *   join to sr_players for name.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FieldTop3 {
  fieldCount: number;
  topPlayers: Array<{ id: string; name: string; rank: number }>;
  firstTeeTime: string | null;
}

export function useFieldTop3(tournamentId: string | null | undefined) {
  return useQuery<FieldTop3 | null>({
    queryKey: ['tournament-v2', 'field-top3', tournamentId],
    enabled: !!tournamentId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!tournamentId) return null;

      const { data: rows, error } = await supabase
        .from('sr_tee_times')
        .select('tee_time, round_number, players:sr_tee_time_players(player_id)')
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('[tournament-v2] useFieldTop3 tee_times', error);
        return null;
      }

      const playerIds = new Set<string>();
      let firstTee: string | null = null;
      for (const r of (rows ?? []) as any[]) {
        for (const p of (r.players ?? [])) {
          if (p?.player_id) playerIds.add(p.player_id);
        }
        if (r.round_number === 1 && r.tee_time) {
          if (!firstTee || new Date(r.tee_time) < new Date(firstTee)) {
            firstTee = r.tee_time;
          }
        }
      }

      if (playerIds.size === 0) {
        return { fieldCount: 0, topPlayers: [], firstTeeTime: firstTee };
      }

      const ids = [...playerIds];
      const { data: rankings, error: rErr } = await supabase
        .from('sr_world_rankings')
        .select('rank, player:sr_players!sr_world_rankings_player_id_fkey(id, full_name, first_name, last_name)')
        .in('player_id', ids)
        .order('rank', { ascending: true })
        .limit(3);

      if (rErr) {
        console.error('[tournament-v2] useFieldTop3 rankings', rErr);
        return { fieldCount: playerIds.size, topPlayers: [], firstTeeTime: firstTee };
      }

      const topPlayers = ((rankings ?? []) as any[])
        .map((r) => {
          const p = r.player;
          if (!p) return null;
          const name = p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
          return { id: p.id, name, rank: r.rank };
        })
        .filter(Boolean) as FieldTop3['topPlayers'];

      return { fieldCount: playerIds.size, topPlayers, firstTeeTime: firstTee };
    },
  });
}
