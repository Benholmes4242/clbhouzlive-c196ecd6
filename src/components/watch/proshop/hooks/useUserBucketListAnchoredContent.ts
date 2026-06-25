import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseAnchoredRow } from './useCourseAnchoredContent';
import type { WatchMoodId } from './useWatchMood';

/**
 * Same shape as useUserCourseAnchoredContent, but pulls from the user's
 * bucket list (course_shortlists, list_key='want_to_play') instead of
 * courses they've played. Powers the "From your bucket list" rail.
 */
export function useUserBucketListAnchoredContent(
  userId: string | undefined,
  mood: WatchMoodId = 'for_you',
) {
  return useQuery({
    queryKey: ['bucket-list-anchored-content', userId, mood],
    enabled: !!userId,
    queryFn: async (): Promise<CourseAnchoredRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc(
        'get_user_course_anchored_content' as any,
        {
          p_user_id: userId,
          p_limit_per_course: 6,
          p_mood: mood,
          p_source: 'want_to_play',
        },
      );
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useUserBucketListAnchoredContent] error:', error);
          throw error;
        }
        return [];
      }
      return (data as CourseAnchoredRow[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
