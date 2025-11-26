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

export const useUserByUsername = (username: string | undefined) => {
  return useQuery({
    queryKey: ['user-by-username', username],
    queryFn: async (): Promise<UserProfileData | null> => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Error fetching user by username:', error);
        return null;
      }

      return data;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
