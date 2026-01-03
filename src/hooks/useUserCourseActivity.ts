import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserCourseActivity {
  user_id: string;
  course_id: string;
  first_activity_at?: string;
  played_at?: string;  // Canonical "when played" timestamp: COALESCE(review_date, created_at)
  edited_at?: string;  // When the rating was last edited (for admin/debug only)
  rating_value?: number;
  has_review: boolean;
  has_rating: boolean;
  has_played: boolean;
  // Computed fields (for compatibility)
  first_played_at?: string;
  last_played_at?: string;
  is_top100?: boolean;
}

export function useUserCourseActivity(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-course-activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Fetch user's course activity - now using played_at (canonical timestamp)
      const { data: activityData, error: activityError } = await supabase
        .from('user_course_activity' as any)
        .select('user_id, course_id, first_activity_at, played_at, edited_at, rating_value, has_review, has_rating, has_played')
        .eq('user_id', userId)
        .order('played_at', { ascending: false, nullsFirst: false });

      if (activityError) throw activityError;

      // Get course IDs to check Top 100 membership
      const courseIds = (activityData || []).map((a: any) => a.course_id);
      
      // Fetch Top 100 memberships for these courses
      const { data: top100Data } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .in('course_id', courseIds);

      const top100Set = new Set((top100Data || []).map(m => m.course_id));

      // Map to expected interface with compatibility fields
      return (activityData || []).map((a: any) => ({
        user_id: a.user_id,
        course_id: a.course_id,
        first_activity_at: a.first_activity_at,
        played_at: a.played_at,
        edited_at: a.edited_at,
        rating_value: a.rating_value,
        has_review: a.has_review,
        has_rating: a.has_rating,
        has_played: a.has_played,
        // Compatibility aliases - now use played_at as canonical
        first_played_at: a.first_activity_at,
        last_played_at: a.played_at,
        is_top100: top100Set.has(a.course_id),
      })) as UserCourseActivity[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
