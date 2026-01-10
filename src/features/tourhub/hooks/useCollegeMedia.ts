import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeCollege } from '@/lib/utils/normalizeCollege';

export interface CollegeMedia {
  id: string;
  college_name: string;
  normalized_name: string;
  logo_url: string | null;
  short_name: string | null;
  country: string | null;
}

/**
 * Fetches all college media records for batch lookups.
 * Creates a map keyed by normalized_name for O(1) lookups.
 */
export function useCollegeMediaMap() {
  return useQuery({
    queryKey: ['college-media', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('college_media')
        .select('id, college_name, normalized_name, logo_url, short_name, country');
      
      if (error) {
        console.error('[useCollegeMediaMap] Error:', error);
        return new Map<string, CollegeMedia>();
      }
      
      const map = new Map<string, CollegeMedia>();
      (data || []).forEach(college => {
        map.set(college.normalized_name, college as CollegeMedia);
      });
      
      return map;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - college data rarely changes
  });
}

/**
 * Looks up a single college by player's college name.
 * Normalizes the input before lookup.
 */
export function useCollegeMedia(collegeName: string | null | undefined) {
  const { data: collegeMap, isLoading } = useCollegeMediaMap();
  
  if (!collegeName || !collegeMap) {
    return { college: null, isLoading };
  }
  
  const normalized = normalizeCollege(collegeName);
  const college = collegeMap.get(normalized) || null;
  
  return { college, isLoading };
}

/**
 * Hook for batch college lookups - returns a resolver function.
 * More efficient than calling useCollegeMedia per player.
 */
export function useCollegeLookup() {
  const { data: collegeMap, isLoading } = useCollegeMediaMap();
  
  const getCollege = (collegeName: string | null | undefined): CollegeMedia | null => {
    if (!collegeName || !collegeMap) return null;
    const normalized = normalizeCollege(collegeName);
    return collegeMap.get(normalized) || null;
  };
  
  return { getCollege, isLoading, collegeMap };
}
