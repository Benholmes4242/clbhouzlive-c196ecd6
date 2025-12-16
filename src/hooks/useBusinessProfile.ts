import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LocationPrecision = 'address' | 'poi' | 'postcode' | 'city' | 'region' | 'country' | 'pin';

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  // New address fields
  address_label: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  country: string | null;
  mapbox_place_id: string | null;
  location_precision: LocationPrecision | null;
  location_updated_at: string | null;
  // Other fields
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useBusinessProfile(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['business-profile', idOrSlug],
    enabled: !!idOrSlug,
    queryFn: async () => {
      if (!idOrSlug) throw new Error('No business ID or slug provided');

      // Try to fetch by slug first, then by id - filter out deleted businesses
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) {
        console.error('[useBusinessProfile] error', error);
        throw error;
      }

      if (!data) {
        throw new Error('Business not found');
      }

      return data as BusinessProfile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
