import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendCourseActivity {
  user_id: string;
  first_played_at?: string;
  last_played_at?: string;
  has_review: boolean;
  has_rating: boolean;
  rating_value: number | null;
  profile: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url: string | null;
  };
}

/**
 * Ratings-only: friends who have rated this course
 */
export function useFriendsWhoPlayedCourse(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['friends-who-played-course', userId, courseId],
    enabled: !!userId && !!courseId,
    queryFn: async () => {
      if (!userId || !courseId) return [];

      // Get friend IDs
      const { data: relationships, error: relError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (relError) throw relError;
      const friendIds = (relationships || []).map((r: any) => r.following_id);
      if (friendIds.length === 0) return [];

      // Get friends who have rated this course (ratings-only)
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          user_id,
          rating,
          review,
          created_at,
          user_profiles!course_ratings_user_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('course_id', courseId)
        .in('user_id', friendIds);

      if (ratingsError) throw ratingsError;
      if (!ratings || ratings.length === 0) return [];

      // Map to the expected interface
      return ratings
        .map((r: any) => ({
          user_id: r.user_id,
          first_played_at: r.created_at,
          last_played_at: r.created_at,
          has_review: !!r.review,
          has_rating: r.rating != null,
          rating_value: r.rating ?? null,
          profile: r.user_profiles,
        }))
        .filter((a: any) => a.profile) as FriendCourseActivity[];
    },
    staleTime: 60_000,
  });
}
