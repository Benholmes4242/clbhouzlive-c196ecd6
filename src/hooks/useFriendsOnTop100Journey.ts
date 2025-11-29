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

      // Get list of friends (users the current user follows)
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          user_profiles!user_follows_following_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('follower_id', userId);

      if (followsError) throw followsError;

      const friends = (followsData || [])
        .map((row: any) => row.user_profiles)
        .filter(Boolean);

      if (friends.length === 0) return [];

      // For each friend, check if they've played any Top 100 course
      const friendsWithTop100: FriendOnTop100[] = [];

      for (const friend of friends) {
        // Check user_top100_courses table
        const { data: top100Data, error: top100Error } = await supabase
          .from('user_top100_courses')
          .select('course_id')
          .eq('user_id', friend.id);

        if (top100Error) {
          console.error('Error fetching Top 100 courses for friend:', top100Error);
          continue;
        }

        const top100Count = top100Data?.length || 0;

        if (top100Count > 0) {
          friendsWithTop100.push({
            user_id: friend.id,
            profile: {
              display_name: friend.display_name,
              username: friend.username,
              profile_photo_url: friend.profile_photo_url,
            },
            top100CoursesPlayed: top100Count,
          });
        }
      }

      return friendsWithTop100;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
