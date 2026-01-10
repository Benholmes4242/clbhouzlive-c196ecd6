import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CollegeSeasonStats {
  id: string;
  season_id: string;
  normalized_name: string;
  player_count: number;
  earnings_total: number;
  wins_total: number;
  cuts_total: number;
  top10_total: number;
  top25_total: number;
  events_total: number;
  // Joined from college_media
  college_name?: string;
  short_name?: string;
  logo_url?: string;
}

// 2025 Season ID
const CURRENT_SEASON_ID = '8d78d0da-6a71-4d51-a68c-a6139c9ecfae';

/**
 * Fetches college season stats with college_media joined.
 * Used for leaderboards and college cards.
 */
export function useCollegeSeasonStats(options?: {
  orderBy?: 'earnings' | 'wins' | 'cuts' | 'top10s';
  limit?: number;
}) {
  const { orderBy = 'earnings', limit = 100 } = options || {};
  
  return useQuery({
    queryKey: ['college-season-stats', orderBy, limit],
    queryFn: async () => {
      // Order column mapping
      const orderColumn = {
        earnings: 'earnings_total',
        wins: 'wins_total',
        cuts: 'cuts_total',
        top10s: 'top10_total',
      }[orderBy];
      
      const { data, error } = await supabase
        .from('college_season_stats')
        .select(`
          id,
          season_id,
          normalized_name,
          player_count,
          earnings_total,
          wins_total,
          cuts_total,
          top10_total,
          top25_total,
          events_total
        `)
        .eq('season_id', CURRENT_SEASON_ID)
        .order(orderColumn, { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('[useCollegeSeasonStats] Error:', error);
        throw error;
      }
      
      return data as CollegeSeasonStats[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetches stats for a single college by normalized name.
 */
export function useCollegeStats(normalizedName: string | undefined) {
  return useQuery({
    queryKey: ['college-stats', normalizedName],
    queryFn: async () => {
      if (!normalizedName) return null;
      
      const { data, error } = await supabase
        .from('college_season_stats')
        .select('*')
        .eq('season_id', CURRENT_SEASON_ID)
        .eq('normalized_name', normalizedName)
        .maybeSingle();
      
      if (error) {
        console.error('[useCollegeStats] Error:', error);
        throw error;
      }
      
      return data as CollegeSeasonStats | null;
    },
    enabled: !!normalizedName,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Searches colleges by name/short_name.
 */
export function useCollegeSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['college-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      // First get matching college_media entries
      const { data: mediaMatches, error: mediaError } = await supabase
        .from('college_media')
        .select('normalized_name, college_name, short_name, logo_url')
        .or(`college_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%`)
        .limit(20);
      
      if (mediaError) {
        console.error('[useCollegeSearch] Media error:', mediaError);
        return [];
      }
      
      if (!mediaMatches?.length) return [];
      
      // Get stats for matched colleges
      const normalizedNames = mediaMatches.map(m => m.normalized_name);
      const { data: stats, error: statsError } = await supabase
        .from('college_season_stats')
        .select('*')
        .eq('season_id', CURRENT_SEASON_ID)
        .in('normalized_name', normalizedNames);
      
      if (statsError) {
        console.error('[useCollegeSearch] Stats error:', statsError);
        return [];
      }
      
      // Merge results
      const statsMap = new Map(stats?.map(s => [s.normalized_name, s]) || []);
      
      return mediaMatches.map(media => ({
        ...media,
        ...(statsMap.get(media.normalized_name) || {}),
      })) as CollegeSeasonStats[];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
