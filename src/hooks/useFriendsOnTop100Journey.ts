import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendOnTop100 {
  user_id: string;
  profile: {
    display_name: string;
    username: string;
    profile_photo_url: string | null;
  };
  top100CoursesPlayed: number;
}

export function useFriendsOnTop100Journey(userId: string | undefined) {
  return useQuery({
    queryKey: ['friends-on-top100-journey', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Step 1: Get list of following IDs
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followsError) throw followsError;
      if (!followsData || followsData.length === 0) return [];

      const followingIds = followsData.map((f) => f.following_id);

      // Step 2: Get profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', followingIds);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) return [];

      // Step 3: Which of them have at least one Top 100 course?
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select('user_id')
        .in('user_id', followingIds);

      if (top100Error) throw top100Error;
      if (!top100Data || top100Data.length === 0) return [];

      const userIdsWithTop100 = new Set(top100Data.map((row) => row.user_id));

      const friendsWithTop100: FriendOnTop100[] = profilesData
        .filter((friend) => userIdsWithTop100.has(friend.id))
        .map((friend) => ({
          user_id: friend.id,
          profile: {
            display_name: friend.display_name || '',
            username: friend.username || '',
            profile_photo_url: friend.profile_photo_url,
          },
          // Flag indicating they're on a Top 100 journey
          top100CoursesPlayed: 1,
        }));

      return friendsWithTop100;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
