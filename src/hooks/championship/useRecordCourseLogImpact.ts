import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseLogImpact {
  rank_before: number;
  rank_after: number;
  rank_change: number;
  division_before: string;
  division_after: string;
  division_changed: boolean;
  promoted: boolean;
  courses_before: number;
  courses_after: number;
  rivals_passed: string[];
  new_streak: number;
  season_name: string;
  days_remaining: number;
}

/**
 * Hook to record the impact of logging a course for the celebration modal.
 * Call this after a user successfully logs a new course.
 */
export function useRecordCourseLogImpact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId?: string }): Promise<CourseLogImpact | null> => {
      const { data, error } = await supabase.rpc('record_course_log_impact', {
        p_user_id: userId,
        p_course_id: courseId || undefined,
      });

      if (error) throw error;
      
      // RPC returns an array, take the first result
      const results = data as CourseLogImpact[];
      
      if (!results || results.length === 0) return null;
      
      return results[0];
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-championship-status', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['championship-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-rivals', variables.userId] });
    },
  });
}
