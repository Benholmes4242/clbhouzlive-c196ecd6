import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Lightweight college search result for signup/profile use
 */
export interface CollegeMediaResult {
  normalized_name: string;
  college_name: string;
  short_name: string | null;
  logo_url: string | null;
}

/**
 * Lightweight hook for searching colleges from college_media table.
 * This is safe to import from anywhere (no TourHub dependencies).
 * 
 * Usage:
 * - Only queries college_media (no season stats)
 * - Enabled after 2+ characters
 * - Returns max 20 results
 */
export function useCollegeMediaSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['college-media-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('college_media')
        .select('normalized_name, college_name, short_name, logo_url')
        .or(`college_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%`)
        .order('college_name')
        .limit(20);
      
      if (error) {
        console.error('[useCollegeMediaSearch] Error:', error);
        return [];
      }
      
      return data as CollegeMediaResult[];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetches a single college by normalized_name.
 * Useful for displaying college info on profiles.
 */
export function useCollegeMediaByName(normalizedName: string | null | undefined) {
  return useQuery({
    queryKey: ['college-media', normalizedName],
    queryFn: async () => {
      if (!normalizedName) return null;
      
      const { data, error } = await supabase
        .from('college_media')
        .select('normalized_name, college_name, short_name, logo_url')
        .eq('normalized_name', normalizedName)
        .maybeSingle();
      
      if (error) {
        console.error('[useCollegeMediaByName] Error:', error);
        return null;
      }
      
      return data as CollegeMediaResult | null;
    },
    enabled: !!normalizedName,
    staleTime: 10 * 60 * 1000, // 10 minutes - college info rarely changes
  });
}
