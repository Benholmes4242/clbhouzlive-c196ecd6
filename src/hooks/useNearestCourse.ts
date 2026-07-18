import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NearestCourse {
  id: string;
  name: string;
  distance_km: number;
}

/**
 * Reverse of useNearbyBusinesses: given a business's coords, find the closest
 * golf club within p_max_km (default 8). Returns the single row or null.
 * NOT added to the query persister.
 */
export function useNearestCourse(
  lat?: number | null,
  lng?: number | null,
  maxKm = 8,
) {
  return useQuery({
    queryKey: ['nearest-course', lat, lng, maxKm],
    enabled: lat != null && lng != null,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<NearestCourse | null> => {
      const { data, error } = await supabase.rpc('get_nearest_golf_club', {
        p_lat: lat as number,
        p_lng: lng as number,
        p_max_km: maxKm,
      });
      if (error) throw error;
      const rows = (data ?? []) as NearestCourse[];
      return rows.length > 0 ? rows[0] : null;
    },
  });
}
