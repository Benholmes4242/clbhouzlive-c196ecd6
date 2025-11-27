import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Unified profile interface - all fields that might be needed
export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  header_photo_url?: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
  show_handicap?: boolean;
  bio?: string | null;
  website?: string | null;
  user_type?: string | null;
  is_public?: boolean | null;
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
        .select('*')
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