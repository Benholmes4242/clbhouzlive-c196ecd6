import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeCollege } from '@/lib/utils/normalizeCollege';

export interface CollegeAlumnus {
  id: string;
  first_name: string;
  last_name: string;
  country: string | null;
  photo_url: string | null;
  world_ranking: number | null;
  college: string;
  // Stats from sr_player_statistics
  earnings?: number;
  wins?: number;
  cuts_made?: number;
  top_10s?: number;
}

// 2025 Season ID
const CURRENT_SEASON_ID = '8d78d0da-6a71-4d51-a68c-a6139c9ecfae';

/**
 * Fetches alumni for a college by normalized name.
 * Joins with sr_player_statistics for current season stats.
 */
export function useCollegeAlumni(normalizedName: string | undefined, options?: {
  orderBy?: 'earnings' | 'world_ranking' | 'wins';
  limit?: number;
}) {
  const { orderBy = 'earnings', limit = 20 } = options || {};
  
  return useQuery({
    queryKey: ['college-alumni', normalizedName, orderBy, limit],
    queryFn: async () => {
      if (!normalizedName) return [];
      
      // First get players with this college
      const { data: players, error: playersError } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, country, photo_url, college')
        .not('college', 'is', null);
      
      if (playersError) {
        console.error('[useCollegeAlumni] Players error:', playersError);
        throw playersError;
      }
      
      // Filter by normalized name
      const matchingPlayers = (players || []).filter(p => 
        normalizeCollege(p.college || '') === normalizedName
      );
      
      if (!matchingPlayers.length) return [];
      
      // Get their stats
      const playerIds = matchingPlayers.map(p => p.id);
      const { data: stats, error: statsError } = await supabase
        .from('sr_player_statistics')
        .select('player_id, raw_data')
        .eq('season_id', CURRENT_SEASON_ID)
        .in('player_id', playerIds);
      
      if (statsError) {
        console.error('[useCollegeAlumni] Stats error:', statsError);
      }
      
      // Merge stats into players
      const statsMap = new Map(stats?.map(s => [s.player_id, s.raw_data]) || []);
      
      const alumni: CollegeAlumnus[] = matchingPlayers.map(p => {
        const rawData = statsMap.get(p.id) as Record<string, unknown> | undefined;
        const statistics = (rawData?.statistics || {}) as Record<string, unknown>;
        
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          country: p.country,
          photo_url: p.photo_url,
          college: p.college || '',
          world_ranking: typeof statistics.world_rank === 'number' ? statistics.world_rank : null,
          earnings: typeof statistics.earnings === 'number' ? statistics.earnings : 0,
          wins: typeof statistics.first_place === 'number' ? statistics.first_place : 0,
          cuts_made: typeof statistics.cuts_made === 'number' ? statistics.cuts_made : 0,
          top_10s: typeof statistics.top_10 === 'number' ? statistics.top_10 : 0,
        };
      });
      
      // Sort by selected metric
      alumni.sort((a, b) => {
        if (orderBy === 'world_ranking') {
          // Lower ranking is better, nulls go to end
          const aRank = a.world_ranking || 9999;
          const bRank = b.world_ranking || 9999;
          return aRank - bRank;
        }
        if (orderBy === 'wins') {
          return (b.wins || 0) - (a.wins || 0);
        }
        // Default: earnings
        return (b.earnings || 0) - (a.earnings || 0);
      });
      
      return alumni.slice(0, limit);
    },
    enabled: !!normalizedName,
    staleTime: 5 * 60 * 1000,
  });
}
