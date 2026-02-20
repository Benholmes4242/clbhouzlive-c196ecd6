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
  // Category averages
  avg_driving_distance: number | null;
  avg_driving_accuracy: number | null;
  avg_gir: number | null;
  avg_putting: number | null;
  avg_scrambling: number | null;
  avg_sand_saves: number | null;
  avg_sg_total: number | null;
  avg_scoring: number | null;
  // Joined from college_media
  college_name?: string;
  short_name?: string;
  logo_url?: string;
}

/**
 * Hook to get the latest season ID that has college data.
 * Queries college_season_stats for the most recent season_id,
 * making the page resilient to pipeline timing mismatches.
 */
export function useCurrentSeasonId() {
  const { data } = useQuery({
    queryKey: ['college-latest-season'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('college_season_stats')
        .select('season_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useCurrentSeasonId] Error:', error);
        throw error;
      }
      return data?.season_id ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
  return data ?? undefined;
}

/**
 * Fetches ALL college season stats (no limit) for client-side sorting.
 * Since we only have ~89 colleges, fetching all is efficient and allows
 * correct metric tab switching without refetching.
 */
export function useCollegeSeasonStats() {
  const seasonId = useCurrentSeasonId();
  
  return useQuery({
    queryKey: ['college-season-stats', seasonId],
    queryFn: async () => {
      if (!seasonId) return [];
      
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
          events_total,
          avg_driving_distance,
          avg_driving_accuracy,
          avg_gir,
          avg_putting,
          avg_scrambling,
          avg_sand_saves,
          avg_sg_total,
          avg_scoring
        `)
        .eq('season_id', seasonId);
      
      if (error) {
        console.error('[useCollegeSeasonStats] Error:', error);
        throw error;
      }
      
      return data as CollegeSeasonStats[];
    },
    enabled: !!seasonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetches stats for a single college by normalized name.
 */
export function useCollegeStats(normalizedName: string | undefined) {
  const seasonId = useCurrentSeasonId();
  
  return useQuery({
    queryKey: ['college-stats', normalizedName, seasonId],
    queryFn: async () => {
      if (!normalizedName || !seasonId) return null;
      
      const { data, error } = await supabase
        .from('college_season_stats')
        .select('*')
        .eq('season_id', seasonId)
        .eq('normalized_name', normalizedName)
        .maybeSingle();
      
      if (error) {
        console.error('[useCollegeStats] Error:', error);
        throw error;
      }
      
      return data as CollegeSeasonStats | null;
    },
    enabled: !!normalizedName && !!seasonId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Searches colleges by name/short_name.
 */
export function useCollegeSearch(searchTerm: string) {
  const seasonId = useCurrentSeasonId();
  
  return useQuery({
    queryKey: ['college-search', searchTerm, seasonId],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2 || !seasonId) return [];
      
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
        .eq('season_id', seasonId)
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
    enabled: searchTerm.length >= 2 && !!seasonId,
    staleTime: 2 * 60 * 1000,
  });
}
