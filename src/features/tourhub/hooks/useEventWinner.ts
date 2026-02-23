import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventWinner {
  id: string;
  tournament_id: string;
  player_id: string;
  winning_score: number | null;
  score_to_par: number | null;
  final_round_score: number | null;
  margin: number | null;
  is_playoff: boolean;
  headline: string | null;
  narrative: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  player?: {
    id: string;
    full_name: string;
    country: string | null;
    photo_url: string | null;
  };
}

/**
 * Fetch winner for a single tournament
 */
export function useEventWinner(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'event-winner', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;
      
      const { data, error } = await supabase
        .from('event_winners')
        .select(`
          *,
          player:sr_players(id, full_name, country, photo_url)
        `)
        // NOTE: photo_url is NOT used for display — headshots come from R2 via getPlayerHeadshotUrl()
        .eq('tournament_id', tournamentId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching event winner:', error);
        return null;
      }
      return data as EventWinner | null;
    },
    enabled: !!tournamentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Batch fetch winners for multiple tournaments
 * Returns a Map of tournament_id -> EventWinner
 */
export function useEventWinners(tournamentIds: string[]) {
  return useQuery({
    queryKey: ['tourhub', 'event-winners', tournamentIds.sort().join(',')],
    queryFn: async () => {
      if (!tournamentIds.length) return new Map<string, EventWinner>();
      
      const { data, error } = await supabase
        .from('event_winners')
        .select(`
          *,
          player:sr_players(id, full_name, country, photo_url)
        `)
        .in('tournament_id', tournamentIds);
      
      if (error) {
        console.error('Error fetching event winners:', error);
        return new Map<string, EventWinner>();
      }
      
      const winnerMap = new Map<string, EventWinner>();
      data?.forEach(item => {
        winnerMap.set(item.tournament_id, item as EventWinner);
      });
      
      return winnerMap;
    },
    enabled: tournamentIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}
