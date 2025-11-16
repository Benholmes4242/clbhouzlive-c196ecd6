import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendCourseActivity {
  user_id: string;
  first_played_at?: string;
  last_played_at?: string;
  has_review: boolean;
  has_rating: boolean;
  profile: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url: string | null;
  };
}

export function useFriendsWhoPlayedCourse(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['friends-who-played-course', userId, courseId],
    enabled: !!userId && !!courseId,
    queryFn: async () => {
      if (!userId || !courseId) return [];

      // Get friend IDs
      const { data: relationships, error: relError } = await supabase
        .from('user_relationships' as any)
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'following');

      if (relError) throw relError;
      const friendIds = (relationships || []).map((r: any) => r.following_id);
      if (friendIds.length === 0) return [];

      // Get their activity for this course with profile data in one query
      const { data: activity, error: actError } = await supabase
        .from('user_course_activity' as any)
        .select(`
          user_id,
          course_id,
          first_played_at,
          last_played_at,
          has_review,
          has_rating,
          user_profiles (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('course_id', courseId)
        .in('user_id', friendIds);

      if (actError) throw actError;
      if (!activity || activity.length === 0) return [];

      // Map to the expected interface
      return activity
        .map((a: any) => ({
          user_id: a.user_id,
          first_played_at: a.first_played_at,
          last_played_at: a.last_played_at,
          has_review: a.has_review,
          has_rating: a.has_rating,
          profile: a.user_profiles,
        }))
        .filter((a: any) => a.profile) as FriendCourseActivity[];
    },
    staleTime: 60_000,
  });
}
