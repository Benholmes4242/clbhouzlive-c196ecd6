/**
 * useWorldRankLookup - world ranking + movement decoration for a set of players.
 *
 * Reads the LATEST ranking_date only from sr_world_rankings, filtered to the
 * passed ids. Returns {} on error: this decorates rows and must never break
 * them.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { movementFrom } from '../../_shared/movement';

export interface WorldRankInfo {
  rank: number;
  priorRank: number | null;
  movement: number | null;
}

export type WorldRankMap = Record<string, WorldRankInfo>;

export function useWorldRankLookup(playerIds: string[]) {
  const ids = [...new Set(playerIds.filter(Boolean))].sort();
  return useQuery<WorldRankMap>({
    queryKey: ['players-v2', 'world-rank-lookup', ids.length, ids[0] ?? '', ids[ids.length - 1] ?? ''],
    enabled: ids.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select('player_id, rank, prior_rank, ranking_date')
        .in('player_id', ids)
        .order('ranking_date', { ascending: false })
        .order('rank', { ascending: true });
      if (error) return {};
      const rows = (data ?? []) as unknown as Array<{
        player_id: string | null;
        rank: number | null;
        prior_rank: number | null;
        ranking_date: string | null;
      }>;
      const latest = rows[0]?.ranking_date ?? null;
      const map: WorldRankMap = {};
      for (const r of rows) {
        if (!r.player_id || r.rank == null || r.rank < 1) continue;
        if (r.ranking_date !== latest) continue;
        if (map[r.player_id]) continue;
        map[r.player_id] = {
          rank: r.rank,
          priorRank: r.prior_rank ?? null,
          movement: movementFrom(r.rank, r.prior_rank ?? null),
        };
      }
      return map;
    },
  });
}
