import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseRatingAggregate {
  course_id: string;
  avg_overall_score?: number;
  avg_design_score?: number;
  avg_condition_score?: number;
  avg_clubhouse_score?: number;
  avg_facilities_score?: number;
  review_count: number;
  text_review_count: number;
}

export function useCourseRatingAggregates(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-rating-aggregates', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('course_rating_aggregates' as any)
        .select('course_id, avg_overall_score, avg_design_score, avg_condition_score, avg_clubhouse_score, avg_facilities_score, review_count, text_review_count')
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as unknown as CourseRatingAggregate | null;
    },
    staleTime: 30 * 60 * 1000,  // 30 min – aggregates are stable
    gcTime:   60 * 60 * 1000,  // 60 min – keep for session
    refetchOnWindowFocus: false,
  });
}
