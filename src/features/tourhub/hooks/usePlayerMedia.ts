import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerMedia {
  id: string;
  player_id: string;
  headshot_url: string;
  source: string | null;
  confidence: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch headshot URL for a single player
 */
export function usePlayerHeadshot(playerId: string | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'player-headshot', playerId],
    queryFn: async () => {
      if (!playerId) return null;
      
      const { data, error } = await supabase
        .from('player_media')
        .select('headshot_url')
        .eq('player_id', playerId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching player headshot:', error);
        return null;
      }
      return data?.headshot_url || null;
    },
    enabled: !!playerId,
    staleTime: 30 * 60 * 1000, // 30 minutes - headshots don't change often
  });
}

/**
 * Batch fetch headshots for multiple players
 * Returns a Map of player_id -> headshot_url
 */
export function usePlayerHeadshots(playerIds: string[]) {
  return useQuery({
    queryKey: ['tourhub', 'player-headshots', playerIds.sort().join(',')],
    queryFn: async () => {
      if (!playerIds.length) return new Map<string, string>();
      
      const { data, error } = await supabase
        .from('player_media')
        .select('player_id, headshot_url')
        .in('player_id', playerIds);
      
      if (error) {
        console.error('Error fetching player headshots:', error);
        return new Map<string, string>();
      }
      
      const headshotMap = new Map<string, string>();
      data?.forEach(item => {
        headshotMap.set(item.player_id, item.headshot_url);
      });
      
      return headshotMap;
    },
    enabled: playerIds.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: (prev: any) => prev,
  });
}
