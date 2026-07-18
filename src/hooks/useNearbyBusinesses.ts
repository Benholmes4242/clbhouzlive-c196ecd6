import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HOSPITALITY_CATEGORIES = [
  'Hotel / Accommodation',
  'Restaurant / Cafe',
  'Bar / Pub',
  'Resort',
];

export interface NearbyBusiness {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  logo_url: string | null;
  cover_image_url: string | null;
  distance_km: number;
  lat: number;
  lng: number;
  is_verified: boolean;
}

export function useNearbyBusinesses(
  lat?: number | null,
  lng?: number | null,
  radiusKm = 15,
) {
  return useQuery({
    queryKey: ['nearby-businesses', lat, lng, radiusKm],
    enabled: lat != null && lng != null,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<NearbyBusiness[]> => {
      const { data, error } = await supabase.rpc('get_nearby_businesses', {
        p_lat: lat as number,
        p_lng: lng as number,
        p_radius_km: radiusKm,
        p_categories: HOSPITALITY_CATEGORIES,
        p_limit: 12,
      });
      if (error) throw error;
      return (data ?? []) as NearbyBusiness[];
    },
  });
}
