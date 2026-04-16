/**
 * useWorldRankingsLeaders — Fetches world rankings from sr_world_rankings.
 * Returns ranked players with total points for the Leaders tab World category.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorldRankEntry {
  id: string;
  rank: number;
  priorRank: number | null;
  totalPoints: number;
  avgPoints: number;
  playerId: string;
  player: {
    id: string;
    full_name: string;
    country: string | null;
    country_code: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
    tour_codes?: string[] | null;
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
          points,
          raw_data,
          ranking_date,
          player_id,
          player:sr_players!sr_world_rankings_player_id_fkey (
            id, full_name, country, country_code,
            photo_url, pga_tour_id, tour_codes
          )
        `)
        .order('ranking_date', { ascending: false })
        .order('rank', { ascending: true })
        .limit(limit + 50);

      if (error) {
        console.error('[useWorldRankingsLeaders]', error);
        return [];
      }

      // Post-filter to latest date
      const latestDate = data?.[0]?.ranking_date ?? null;
      const latestRows = latestDate ? (data ?? []).filter(r => r.ranking_date === latestDate) : (data ?? []);

      // Deduplicate by player_id as safety fallback
      const seen = new Set<string>();
      const unique = latestRows.filter((d) => {
        if (!d.player_id || seen.has(d.player_id)) return false;
        seen.add(d.player_id);
        return true;
      });

      return unique
        .filter((d) => d.player && d.rank > 0)
        .map((d) => {
          const rawStats = (d.raw_data as any)?.statistics;
          const totalPts =
            d.points ??
            (rawStats?.points ? Number(rawStats.points) : 0);
          const avgPts =
            d.avg_points ??
            (rawStats?.avg_points ? Number(rawStats.avg_points) : 0);

          return {
            id: d.id,
            rank: d.rank,
            priorRank: d.prior_rank,
            totalPoints: totalPts,
            avgPoints: avgPts,
            playerId: d.player_id!,
            player: d.player as any,
          };
        });
    },
    staleTime: 5 * 60 * 1000,
  });
}
