import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
}

/**
 * Fetches accepted friends for a user.
 * Friends can appear in either user_id or friend_id column.
 */
export function useUserFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-friends', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Query user_friends where user is either party and status is accepted
      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          user_id,
          friend_id,
          user_profiles!user_friends_user_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url
          ),
          friend_profiles:user_profiles!user_friends_friend_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;

      // Extract the "other" user's profile
      return (data || [])
        .map((row: any) => {
          const profile = row.user_id === userId ? row.friend_profiles : row.user_profiles;
          return profile;
        })
        .filter(Boolean) as FriendProfile[];
    },
    staleTime: 60_000,
  });
}
