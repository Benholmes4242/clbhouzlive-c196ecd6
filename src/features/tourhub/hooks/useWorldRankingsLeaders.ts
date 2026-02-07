/**
 * useWorldRankingsLeaders — Fetches world rankings from sr_world_rankings.
 * Extracts avg_points from raw_data.statistics since the column is unpopulated.
 * Returns ranked players with avg points for the Leaders tab World category.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorldRankEntry {
  id: string;
  rank: number;
  priorRank: number | null;
  avgPoints: number;
  playerId: string;
  player: {
    id: string;
    full_name: string;
    country: string | null;
    country_code: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
  };
}

export function useWorldRankingsLeaders(limit = 50) {
  return useQuery({
    queryKey: ['tourhub', 'world-rankings-leaders', limit],
    queryFn: async (): Promise<WorldRankEntry[]> => {
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select(`
          id,
          rank,
          prior_rank,
          avg_points,
          raw_data,
          player_id,
          player:sr_players!sr_world_rankings_player_id_fkey (
            id, full_name, country, country_code,
            photo_url, pga_tour_id
          )
        `)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('[useWorldRankingsLeaders]', error);
        return [];
      }

      return (data ?? [])
        .filter((d) => d.player && d.rank > 0)
        .map((d) => {
          // avg_points column is null; extract from raw_data.statistics
          const rawStats = (d.raw_data as any)?.statistics;
          const avgPts =
            d.avg_points ??
            (rawStats?.avg_points ? Number(rawStats.avg_points) : 0);

          return {
            id: d.id,
            rank: d.rank,
            priorRank: d.prior_rank,
            avgPoints: avgPts,
            playerId: d.player_id!,
            player: d.player as any,
          };
        });
    },
    staleTime: 5 * 60 * 1000,
  });
}
