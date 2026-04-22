import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseAnchoredRow {
  course_id: string;
  course_name: string;
  course_country: string | null;
  content_count: number;
  recent_post_ids: string[];
}

export function useUserCourseAnchoredContent(userId: string | undefined) {
  return useQuery({
    queryKey: ['course-anchored-content', userId],
    enabled: !!userId,
    queryFn: async (): Promise<CourseAnchoredRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_user_course_anchored_content' as any, {
        p_user_id: userId,
        p_limit_per_course: 6,
      });
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useUserCourseAnchoredContent] error:', error);
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
