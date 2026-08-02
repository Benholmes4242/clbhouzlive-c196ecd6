/**
 * useWorldRankLookup - world ranking + movement decoration for a set of players.
 *
 * Resolves the latest ranking_date in one tiny query, then fetches the
 * decoration rows for that date only, chunked into batches of 100 ids so the
 * request URL cannot run past the practical length limit.
 *
 * Returns {} on error: this decorates rows and must never break them.
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

const CHUNK = 100;

function chunkIds(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) out.push(ids.slice(i, i + CHUNK));
  return out;
}

interface RankRow {
  player_id: string | null;
  rank: number | null;
  prior_rank: number | null;
}

export function useWorldRankLookup(playerIds: string[]) {
  const ids = [...new Set(playerIds.filter(Boolean))].sort();
  return useQuery<WorldRankMap>({
    queryKey: ['players-v2', 'world-rank-lookup', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: dateData, error: dateErr } = await supabase
        .from('sr_world_rankings')
        .select('ranking_date')
        .order('ranking_date', { ascending: false })
        .limit(1);
      if (dateErr) return {};
      const latestDate = (dateData ?? [])[0]?.ranking_date ?? null;
      if (!latestDate) return {};

      const batches = await Promise.all(
        chunkIds(ids).map(async (chunk) => {
          const { data, error } = await supabase
            .from('sr_world_rankings')
            .select('player_id, rank, prior_rank')
            .eq('ranking_date', latestDate)
            .in('player_id', chunk);
          if (error) return [] as RankRow[];
          return (data ?? []) as unknown as RankRow[];
        }),
      );

      const map: WorldRankMap = {};
      for (const rows of batches) {
        for (const r of rows) {
          if (!r.player_id || r.rank == null || r.rank < 1) continue;
          map[r.player_id] = {
            rank: r.rank,
            priorRank: r.prior_rank ?? null,
            movement: movementFrom(r.rank, r.prior_rank ?? null),
          };
        }
      }
      return map;
    },
  });
}
