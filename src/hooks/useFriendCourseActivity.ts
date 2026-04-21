import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendCourseActivity {
  course_id: string;
  friend_played_count: number;
  top_friend_names: string[];
  top_friend_avatars: string[];
  network_rating_avg: number | null;
  network_rating_count: number;
  self_has_played: boolean;
  self_has_reviewed: boolean;
  nudge_dismissed_recently: boolean;
}

export type FriendCourseActivityMap = Record<string, FriendCourseActivity>;

/**
 * Batched fetch of friend-course activity for a feed page.
 * Returns a map keyed by course_id.
 */
export function useFriendCourseActivity(
  userId: string | undefined,
  courseIds: string[]
) {
  // Stable key: sorted unique IDs
  const sortedIds = [...new Set(courseIds.filter(Boolean))].sort();
  const key = sortedIds.join(',');

  return useQuery({
    queryKey: ['friend-course-activity', userId, key],
    enabled: !!userId && sortedIds.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<FriendCourseActivityMap> => {
      if (!userId || sortedIds.length === 0) return {};

      const { data, error } = await supabase.rpc('get_friend_course_activity', {
        p_user_id: userId,
        p_course_ids: sortedIds,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useFriendCourseActivity] RPC error:', error);
        }
        throw error;
      }

      const map: FriendCourseActivityMap = {};
      for (const row of (data as FriendCourseActivity[] | null) || []) {
        map[row.course_id] = row;
      }
      return map;
    },
  });
}
