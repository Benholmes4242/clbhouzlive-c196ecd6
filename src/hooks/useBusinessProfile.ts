import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

export type LocationPrecision = 'address' | 'poi' | 'postcode' | 'city' | 'region' | 'country' | 'pin';

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  // Club linkage
  club_id: string | null;
  club_key: string | null;
  club_name: string | null;
  // Address fields
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
  // New fields — Edit Wizard upgrade
  founded_year: number | null;
  booking_url: string | null;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  social_links: { instagram?: string; twitter?: string; facebook?: string; youtube?: string } | null;
}

export function useBusinessProfile(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['business-profile', 'v3_course_fallback', idOrSlug],
    enabled: !!idOrSlug,
    queryFn: async () => {
      if (!idOrSlug) throw new Error('No business ID or slug provided');

      // Fetch business with joined golf_clubs and golf_courses for coords fallback chain
      const { data, error } = await supabase
        .from('business_accounts')
        .select(`
          *,
          golf_clubs:club_id (
            id,
            latitude,
            longitude
          )
        `)
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) {
        AppLog.error('[useBusinessProfile]', 'query error', error);
        throw error;
      }

      if (!data) {
        throw new Error('Business not found');
      }

      // Extract golf_clubs coords as first fallback
      const golfClub = data.golf_clubs as { id: string; latitude: number | null; longitude: number | null } | null;
      
      let finalLat = data.lat ?? golfClub?.latitude ?? null;
      let finalLng = data.lng ?? golfClub?.longitude ?? null;

      // If still no coords, try to get coords from linked golf_courses
      // Use club_id from either the joined object or directly from business data
      const clubIdForCourses = golfClub?.id ?? data.club_id;
      
      if ((finalLat === null || finalLng === null) && clubIdForCourses) {
        const { data: courseData, error: courseError } = await supabase
          .from('golf_courses')
          .select('latitude, longitude')
          .eq('club_id', clubIdForCourses)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(1)
          .maybeSingle();

        if (courseError) {
          AppLog.error('[useBusinessProfile]', 'course coords fallback error', courseError);
        }

        if (courseData) {
          finalLat = courseData.latitude;
          finalLng = courseData.longitude;
          AppLog.debug('[useBusinessProfile]', 'Using course coords fallback:', finalLat, finalLng);
        }
      }

      // Remove the nested golf_clubs object and build the result
      const { golf_clubs: _, ...businessData } = data;
      
      const result: BusinessProfile = {
        ...(businessData as unknown as BusinessProfile),
        // Use business coords → golf_clubs coords → golf_courses coords
        lat: finalLat,
        lng: finalLng,
      };

      return result;
    },
    staleTime: 30 * 1000, // 30 seconds - shorter for fresher verification status
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
