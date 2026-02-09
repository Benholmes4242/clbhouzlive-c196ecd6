/**
 * useWorldRankingsOverview - Data hook for the redesigned World Rankings section
 * 
 * Fetches top players from sr_world_rankings with prior_rank for velocity,
 * and generates a narrative headline from movement data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RankingEntry {
  playerId: string;
  firstName: string;
  lastName: string;
  country: string | null;
  photoUrl: string | null;
  pgaTourId: string | null;
  rank: number;
  priorRank: number | null;
  avgPoints: number | null;
  totalPoints: number | null;
  movement: number; // positive = climbed, negative = dropped
  tier: 'crown' | 'elite' | 'contender' | 'standard';
}

export interface WorldRankingsOverviewData {
  entries: RankingEntry[];
  movers: RankingEntry[]; // top movers by movement magnitude
  narrative: string;
  no1AvgPoints: number | null;
}

function getTier(rank: number): RankingEntry['tier'] {
  if (rank === 1) return 'crown';
  if (rank <= 3) return 'elite';
  if (rank <= 10) return 'contender';
  return 'standard';
}

function generateNarrative(entries: RankingEntry[]): string {
  if (entries.length === 0) return '';
  
  const no1 = entries[0];
  const biggestClimber = entries
    .filter(e => e.movement > 0)
    .sort((a, b) => b.movement - a.movement)[0];
  
  const top5Shuffled = entries.slice(0, 5).some(e => Math.abs(e.movement) > 0);
  
  if (biggestClimber && biggestClimber.movement >= 3) {
    if (no1.movement === 0) {
      return `${no1.lastName} holds No.1 as ${biggestClimber.lastName} surges +${biggestClimber.movement}`;
    }
    return `Top-5 reshuffle as ${biggestClimber.lastName} climbs +${biggestClimber.movement}`;
  }
  
  if (!top5Shuffled) {
    return `No.1 unchanged — pressure building behind ${no1.lastName}`;
  }
  
  return `${no1.lastName} leads the Official World Golf Ranking`;
}

export function useWorldRankingsOverview(limit: number = 20) {
  return useQuery({
    queryKey: ['world-rankings-overview', limit],
    queryFn: async (): Promise<WorldRankingsOverviewData> => {
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          prior_rank,
          avg_points,
          points,
          player:sr_players!inner(
            id,
            first_name,
            last_name,
            country,
            photo_url,
            pga_tour_id
          )
        `)
        .gte('rank', 1)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const entries: RankingEntry[] = (data || []).map((row: any) => {
        const priorRank = row.prior_rank as number | null;
        const movement = priorRank ? priorRank - row.rank : 0;
        
        return {
          playerId: row.player.id,
          firstName: row.player.first_name,
          lastName: row.player.last_name,
          country: row.player.country,
          photoUrl: row.player.photo_url,
          pgaTourId: row.player.pga_tour_id,
          rank: row.rank,
          priorRank: priorRank,
          avgPoints: row.avg_points,
          totalPoints: row.points,
          movement,
          tier: getTier(row.rank),
        };
      });

      // Top movers: highest absolute movement, positive only, min +2
      const movers = entries
        .filter(e => e.movement >= 2)
        .sort((a, b) => b.movement - a.movement)
        .slice(0, 8);

      const no1AvgPoints = entries[0]?.avgPoints ?? null;
      const narrative = generateNarrative(entries);

      return { entries, movers, narrative, no1AvgPoints };
    },
    staleTime: 5 * 60 * 1000,
  });
}
