/**
 * useActivePlayers - Hook for "On Tour" (most active) players
 * Directly queries sr_player_statistics for players with most events played
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivePlayer {
  id: string;
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  pgaTourId: string | null;
  eventsPlayed: number;
  cutsMade: number | null;
  wins: number | null;
  top10s: number | null;
}

/**
 * Fetch players with most events played from sr_player_statistics
 */
export function useActivePlayers(minEvents: number = 10, limit: number = 100) {
  return useQuery({
    queryKey: ['tourhub', 'active-players', minEvents, limit],
    queryFn: async () => {
      // Get player statistics with minimum events
      const { data: stats, error: statsError } = await supabase
        .from('sr_player_statistics')
        .select('id, player_id, events_played, cuts_made, wins, top_10s, raw_data')
        .gte('events_played', minEvents)
        .order('events_played', { ascending: false })
        .limit(limit);
      
      if (statsError) {
        console.error('[useActivePlayers] Error fetching stats:', statsError);
        return [];
      }
      
      if (!stats || stats.length === 0) {
        console.log('[useActivePlayers] No stats found');
        return [];
      }
      
      // Get player IDs
      const playerIds = [...new Set(stats.map(s => s.player_id))];
      
      // Fetch player details
      const { data: players, error: playersError } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, country, country_code, photo_url, pga_tour_id')
        .in('id', playerIds);
      
      if (playersError) {
        console.error('[useActivePlayers] Error fetching players:', playersError);
      }
      
      // Create player lookup map
      const playerMap = new Map(players?.map(p => [p.id, p]) || []);
      
      // Map stats to active players
      const activePlayers: ActivePlayer[] = stats.map(stat => {
        const player = playerMap.get(stat.player_id);
        const rawData = stat.raw_data as any;
        
        return {
          id: stat.id,
          playerId: stat.player_id,
          playerName: player?.full_name || 'Unknown',
          firstName: player?.first_name || '',
          lastName: player?.last_name || '',
          country: player?.country || null,
          countryCode: player?.country_code || null,
          photoUrl: player?.photo_url || null,
          pgaTourId: player?.pga_tour_id || null,
          eventsPlayed: stat.events_played || 0,
          cutsMade: stat.cuts_made ?? rawData?.statistics?.cuts_made ?? null,
          wins: stat.wins ?? rawData?.statistics?.first_place ?? null,
          top10s: stat.top_10s ?? rawData?.statistics?.top_10 ?? null,
        };
      });
      
      console.log('[useActivePlayers] Loaded active players:', activePlayers.length);
      return activePlayers;
    },
    staleTime: 5 * 60 * 1000,
  });
}
