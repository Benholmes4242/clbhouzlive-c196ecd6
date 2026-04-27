import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from './useCollegeStats';

export interface CollegeAlumnus {
  id: string;
  first_name: string;
  last_name: string;
  country: string | null;
  photo_url: string | null;
  pga_tour_id: string | null;
  tour_codes: string[] | null;
  world_ranking: number | null;
  college: string;
  // Stats from sr_player_statistics
  earnings?: number;
  wins?: number;
  cuts_made?: number;
  top_10s?: number;
  /** Events played in the current season. Defaults to 0 when null/missing.
   *  Used by the 4-tier alumni model to gate Rising vs Legacy ("inactive"). */
  events_played?: number;
}

/**
 * Fetches alumni for a college by normalized name.
 * Uses the indexed college_normalized column for efficient queries.
 * Joins with sr_player_statistics for current season stats.
 */
export function useCollegeAlumni(normalizedName: string | undefined, options?: {
  orderBy?: 'earnings' | 'world_ranking' | 'wins';
  limit?: number;
}) {
  const { orderBy = 'earnings', limit = 20 } = options || {};
  const seasonId = useCurrentSeasonId();
  
  return useQuery({
    queryKey: ['college-alumni', normalizedName, seasonId, orderBy, limit],
    queryFn: async () => {
      if (!normalizedName || !seasonId) return [];
      
      // Query players directly using the indexed college_normalized column
      const { data: players, error: playersError } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, country, photo_url, pga_tour_id, college, tour_codes')
        .eq('college_normalized', normalizedName);
      
      if (playersError) {
        console.error('[useCollegeAlumni] Players error:', playersError);
        throw playersError;
      }
      
      if (!players?.length) return [];
      
      // Get their stats — include cuts_made and wins columns directly
      const playerIds = players.map(p => p.id);
      const { data: stats, error: statsError } = await supabase
        .from('sr_player_statistics')
        .select('player_id, cuts_made, wins, events_played, raw_data')
        .eq('season_id', seasonId)
        .in('player_id', playerIds);
      
      if (statsError) {
        console.error('[useCollegeAlumni] Stats error:', statsError);
      }
      
      // Merge stats into players
      const statsMap = new Map(stats?.map(s => [s.player_id, s]) || []);
      
      const alumni: CollegeAlumnus[] = players.map(p => {
        const s = statsMap.get(p.id);
        const rawData = s?.raw_data as Record<string, unknown> | undefined;
        const statistics = (rawData?.statistics || {}) as Record<string, unknown>;
        
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          country: p.country,
          photo_url: p.photo_url,
          pga_tour_id: p.pga_tour_id || null,
          tour_codes: (p as any).tour_codes ?? null,
          college: p.college || '',
          world_ranking: typeof statistics.world_rank === 'number' ? statistics.world_rank : null,
          earnings: typeof statistics.earnings === 'number' ? statistics.earnings : 0,
          wins: typeof s?.wins === 'number' ? s.wins : (typeof statistics.first_place === 'number' ? statistics.first_place : 0),
          cuts_made: typeof s?.cuts_made === 'number' ? s.cuts_made : (typeof statistics.cuts_made === 'number' ? statistics.cuts_made : 0),
          top_10s: typeof statistics.top_10 === 'number' ? statistics.top_10 : 0,
          events_played: typeof s?.events_played === 'number' ? s.events_played : 0,
        };
      });
      
      // Sort by selected metric
      alumni.sort((a, b) => {
        if (orderBy === 'world_ranking') {
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
    enabled: !!normalizedName && !!seasonId,
    staleTime: 5 * 60 * 1000,
  });
}