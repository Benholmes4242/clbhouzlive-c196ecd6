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

      const followingIds = followsData.map(f => f.following_id);

      // Step 2: Get profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', followingIds);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) return [];

      // Step 3: For each friend, check if they've played any Top 100 course
      const friendsWithTop100: FriendOnTop100[] = [];

      for (const friend of profilesData) {
        const { data: top100Data, error: top100Error } = await supabase
          .from('user_top100_courses')
          .select('course_id')
          .eq('user_id', friend.id)
          .limit(1); // Only need to know if they have at least one

        if (top100Error) {
          console.error('Error fetching Top 100 courses for friend:', top100Error);
          continue;
        }

        if (top100Data && top100Data.length > 0) {
          friendsWithTop100.push({
            user_id: friend.id,
            profile: {
              display_name: friend.display_name || '',
              username: friend.username || '',
              profile_photo_url: friend.profile_photo_url,
            },
            top100CoursesPlayed: top100Data.length,
          });
        }
      }

      return friendsWithTop100;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
