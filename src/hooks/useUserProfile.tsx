import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileData {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
}

export const useUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async (): Promise<UserProfileData | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};