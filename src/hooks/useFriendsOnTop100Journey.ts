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
  lastActivityAt?: string;
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

      // Step 3: Get Top 100 courses with most recent activity timestamp per user
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select('user_id, updated_at')
        .in('user_id', followingIds)
        .order('updated_at', { ascending: false });

      if (top100Error) throw top100Error;
      if (!top100Data || top100Data.length === 0) return [];

      // Get most recent activity per user
      const userActivityMap = new Map<string, string>();
      top100Data.forEach((row) => {
        if (!userActivityMap.has(row.user_id)) {
          userActivityMap.set(row.user_id, row.updated_at);
        }
      });

      const friendsWithTop100: FriendOnTop100[] = profilesData
        .filter((friend) => userActivityMap.has(friend.id))
        .map((friend) => ({
          user_id: friend.id,
          profile: {
            display_name: friend.display_name || '',
            username: friend.username || '',
            profile_photo_url: friend.profile_photo_url,
          },
          // Flag indicating they're on a Top 100 journey
          top100CoursesPlayed: 1,
          lastActivityAt: userActivityMap.get(friend.id) || '',
        }));

      // Sort by most recent activity
      friendsWithTop100.sort((a, b) => {
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      });

      return friendsWithTop100;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
