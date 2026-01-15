import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PROFILE_FULL } from '@/lib/supabase/selects';
import { ProfileType, BusinessCategory } from '@/types/profile';

// Unified profile interface - all fields that might be needed
export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  header_photo_url?: string | null;
  home_club: string | null;
  // DEPRECATED: home_club_id is never written, use primary_club_id instead
  // home_club_id?: string | null;
  primary_club_id?: string | null; // Links to golf_clubs.id - canonical club identity
  eg_handicap_index: number | null;
  show_handicap?: boolean;
  bio?: string | null;
  website?: string | null;
  user_type?: string | null;
  profile_type?: ProfileType | null;
  is_public?: boolean | null;
  is_official_club?: boolean | null;
  has_completed_onboarding?: boolean | null;
  mini_card_crop_x?: number | null;
  mini_card_crop_y?: number | null;
  mini_card_crop_width?: number | null;
  mini_card_crop_height?: number | null;
  desktop_crop_x?: number | null;
  desktop_crop_y?: number | null;
  desktop_crop_width?: number | null;
  desktop_crop_height?: number | null;
  profile_video_url?: string | null;
  profile_video_thumbnail_url?: string | null;
  has_profile_video?: boolean | null;
  background_image_url?: string | null;
  cover_photo_url?: string | null;
  eg_app_connected?: boolean | null;
  updated_at?: string | null;
  // Location field (used by both personal and business)
  location?: string | null;
  // Business profile fields
  business_name?: string | null;
  business_category?: BusinessCategory | null;
  business_website?: string | null;
  business_location?: string | null;
  business_contact_email?: string | null;
  business_contact_phone?: string | null;
  business_bio?: string | null;
  is_business_verified?: boolean | null;
  is_verified_business?: boolean | null;
  is_verified_golfer?: boolean | null;
  verified_business_at?: string | null;
  verified_business_notes?: string | null;
  // Websites array (personal profiles)
  websites?: string[] | null;
  // Notification tracking
  last_notifications_seen_at?: string | null;
  // Creator mode fields
  is_creator?: boolean | null;
  creator_only?: boolean | null;
}

/**
 * Shared profile hook - single source of truth for profile data.
 * Query key: ['user-profile', userId]
 */
export const useUserProfile = (userId: string | undefined | null) => {
  return useQuery<UserProfile | null>({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') // Full profile needed for this hook
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useUserProfile] Error fetching profile:', error);
        throw error;
      }

      return data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min - profile changes are rare
    gcTime: 10 * 60 * 1000,
  });
};