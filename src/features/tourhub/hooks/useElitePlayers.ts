/**
 * useElitePlayers - Hook for Elite (Top 50 World Ranked) players
 * Directly queries sr_world_rankings for accurate OWGR data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ElitePlayer {
  id: string;
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  pgaTourId: string | null;
  worldRank: number;
  avgPoints: number | null;
  priorRank: number | null;
  rankChange: number | null;
}

/**
 * Fetch top 50 world ranked players from sr_world_rankings
 */
export function useElitePlayers(limit: number = 50) {
  return useQuery({
    queryKey: ['tourhub', 'elite-players', limit],
    queryFn: async () => {
      // Get world rankings with player data joined
      const { data: rankings, error: rankingsError } = await supabase
        .from('sr_world_rankings')
        .select(`
          id,
          player_id,
          rank,
          prior_rank,
          avg_points,
          raw_data
        `)
        .order('rank', { ascending: true })
        .limit(limit);
      
      if (rankingsError) {
        console.error('[useElitePlayers] Error fetching rankings:', rankingsError);
        return [];
      }
      
      if (!rankings || rankings.length === 0) {
        console.log('[useElitePlayers] No rankings found');
        return [];
      }
      
      // Get player IDs
      const playerIds = rankings.map(r => r.player_id);
      
      // Fetch player details
      const { data: players, error: playersError } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, country, country_code, photo_url, pga_tour_id')
        .in('id', playerIds);
      
      if (playersError) {
        console.error('[useElitePlayers] Error fetching players:', playersError);
      }
      
      // Create player lookup map
      const playerMap = new Map(players?.map(p => [p.id, p]) || []);
      
      // Map rankings to elite players
      const elitePlayers: ElitePlayer[] = rankings.map(ranking => {
        const player = playerMap.get(ranking.player_id);
        const rawData = ranking.raw_data as any;
        
        // Extract avg_points from raw_data.statistics (may be string or number)
        const rawAvgPoints = ranking.avg_points ?? rawData?.statistics?.avg_points;
        const avgPoints = rawAvgPoints !== null && rawAvgPoints !== undefined 
          ? parseFloat(String(rawAvgPoints)) 
          : null;
        
        // Calculate rank change
        const rankChange = ranking.prior_rank 
          ? ranking.prior_rank - ranking.rank 
          : null;
        
        return {
          id: ranking.id,
          playerId: ranking.player_id,
          playerName: player?.full_name || rawData?.first_name + ' ' + rawData?.last_name || 'Unknown',
          firstName: player?.first_name || rawData?.first_name || '',
          lastName: player?.last_name || rawData?.last_name || '',
          country: player?.country || rawData?.country || null,
          countryCode: player?.country_code || null,
          photoUrl: player?.photo_url || null,
          pgaTourId: player?.pga_tour_id || null,
          worldRank: ranking.rank,
          avgPoints: avgPoints,
          priorRank: ranking.prior_rank,
          rankChange: rankChange,
        };
      });
      
      console.log('[useElitePlayers] Loaded elite players:', elitePlayers.length);
      return elitePlayers;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: (prev: any) => prev,
  });
}

/**
 * Get a single player's world ranking info
 */
export function usePlayerWorldRank(playerId: string) {
  return useQuery({
    queryKey: ['tourhub', 'player-world-rank', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select('rank, prior_rank, avg_points, raw_data')
        .eq('player_id', playerId)
        .single();
      
      if (error || !data) return null;
      
      const rawData = data.raw_data as any;
      return {
        worldRank: data.rank,
        priorRank: data.prior_rank,
        avgPoints: data.avg_points ?? rawData?.statistics?.avg_points ?? null,
        rankChange: data.prior_rank ? data.prior_rank - data.rank : null,
      };
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}
