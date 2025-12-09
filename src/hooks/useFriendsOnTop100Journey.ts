import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendOnTop100 {
  user_id: string;
  profile: {
    display_name: string;
    username: string;
    profile_photo_url: string | null;
    home_club: string | null;
    handicap: number | null;
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
        .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
        .in('id', followingIds);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) return [];

      // Step 3: Get Top 100 rated courses count per user from user_top100_rated_courses view
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_rated_courses' as any)
        .select('user_id')
        .in('user_id', followingIds);

      if (top100Error) throw top100Error;

      // Count Top 100 courses per user
      const userTop100CountMap = new Map<string, number>();
      for (const row of (top100Data || []) as any[]) {
        userTop100CountMap.set(row.user_id, (userTop100CountMap.get(row.user_id) || 0) + 1);
      }

      // Step 4: Get most recent activity timestamp per user
      const { data: activityData, error: activityError } = await supabase
        .from('user_top100_courses')
        .select('user_id, updated_at')
        .in('user_id', followingIds)
        .order('updated_at', { ascending: false });

      if (activityError) throw activityError;

      // Get most recent activity per user
      const userActivityMap = new Map<string, string>();
      (activityData || []).forEach((row) => {
        if (!userActivityMap.has(row.user_id)) {
          userActivityMap.set(row.user_id, row.updated_at);
        }
      });

      // Build friends list with actual Top 100 count
      const friendsWithTop100: FriendOnTop100[] = profilesData
        .filter((friend) => userTop100CountMap.has(friend.id) && userTop100CountMap.get(friend.id)! > 0)
        .map((friend) => ({
          user_id: friend.id,
          profile: {
            display_name: friend.display_name || '',
            username: friend.username || '',
            profile_photo_url: friend.profile_photo_url,
            home_club: (friend as any).home_club || null,
            handicap: (friend as any).eg_handicap_index ?? null,
          },
          top100CoursesPlayed: userTop100CountMap.get(friend.id) || 0,
          lastActivityAt: userActivityMap.get(friend.id) || '',
        }));

      // Sort by total Top 100 courses played (descending)
      friendsWithTop100.sort((a, b) => b.top100CoursesPlayed - a.top100CoursesPlayed);

      return friendsWithTop100;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
