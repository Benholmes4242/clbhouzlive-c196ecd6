import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from './useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from './useCollegeMedia';
import { useCollegeAlumni, type CollegeAlumnus } from './useCollegeAlumni';
import type { CollegeSeasonStats } from './useCollegeStats';

export interface CollegeCompareData {
  college1: {
    stats: CollegeSeasonStats | null;
    media: CollegeMedia | null;
    topEarners: CollegeAlumnus[];
    topRanked: CollegeAlumnus[];
  };
  college2: {
    stats: CollegeSeasonStats | null;
    media: CollegeMedia | null;
    topEarners: CollegeAlumnus[];
    topRanked: CollegeAlumnus[];
  };
}

/**
 * Fetches comparison data for two colleges.
 */
export function useCollegeCompare(c1: string | undefined, c2: string | undefined) {
  const seasonId = useCurrentSeasonId();
  const { data: collegeMap } = useCollegeMediaMap();
  
  return useQuery({
    queryKey: ['college-compare', c1, c2, seasonId],
    queryFn: async (): Promise<CollegeCompareData> => {
      if (!c1 || !c2 || !seasonId) {
        return {
          college1: { stats: null, media: null, topEarners: [], topRanked: [] },
          college2: { stats: null, media: null, topEarners: [], topRanked: [] },
        };
      }
      
      // Fetch stats for both colleges in parallel
      const [stats1, stats2] = await Promise.all([
        supabase
          .from('college_season_stats')
          .select('*')
          .eq('season_id', seasonId)
          .eq('normalized_name', c1)
          .maybeSingle(),
        supabase
          .from('college_season_stats')
          .select('*')
          .eq('season_id', seasonId)
          .eq('normalized_name', c2)
          .maybeSingle(),
      ]);
      
      // Fetch alumni for both colleges
      const [alumni1, alumni2] = await Promise.all([
        fetchAlumniForCompare(c1, seasonId),
        fetchAlumniForCompare(c2, seasonId),
      ]);
      
      return {
        college1: {
          stats: stats1.data as CollegeSeasonStats | null,
          media: collegeMap?.get(c1) || null,
          topEarners: alumni1.topEarners,
          topRanked: alumni1.topRanked,
        },
        college2: {
          stats: stats2.data as CollegeSeasonStats | null,
          media: collegeMap?.get(c2) || null,
          topEarners: alumni2.topEarners,
          topRanked: alumni2.topRanked,
        },
      };
    },
    enabled: !!c1 && !!c2 && !!seasonId,
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchAlumniForCompare(normalizedName: string, seasonId: string) {
  // Get players with their stats
  const { data: players } = await supabase
    .from('sr_players')
    .select('id, first_name, last_name, country, photo_url, pga_tour_id, college, tour_codes')
    .eq('college_normalized', normalizedName);
  
  if (!players?.length) {
    return { topEarners: [], topRanked: [] };
  }
  
  const playerIds = players.map(p => p.id);
  const { data: stats } = await supabase
    .from('sr_player_statistics')
    .select('player_id, raw_data')
    .eq('season_id', seasonId)
    .in('player_id', playerIds);
  
  const statsMap = new Map(stats?.map(s => [s.player_id, s.raw_data]) || []);
  
  const alumni: CollegeAlumnus[] = players.map(p => {
    const rawData = statsMap.get(p.id) as Record<string, unknown> | undefined;
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
      wins: typeof statistics.first_place === 'number' ? statistics.first_place : 0,
      cuts_made: typeof statistics.cuts_made === 'number' ? statistics.cuts_made : 0,
      top_10s: typeof statistics.top_10 === 'number' ? statistics.top_10 : 0,
    };
  });
  
  // Sort for top earners
  const topEarners = [...alumni]
    .sort((a, b) => (b.earnings || 0) - (a.earnings || 0))
    .slice(0, 5);
  
  // Sort for top ranked
  const topRanked = [...alumni]
    .filter(a => a.world_ranking && a.world_ranking < 9999)
    .sort((a, b) => (a.world_ranking || 9999) - (b.world_ranking || 9999))
    .slice(0, 5);
  
  return { topEarners, topRanked };
}
