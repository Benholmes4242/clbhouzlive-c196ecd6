import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserCourseRating {
  id: string;
  rating: number;
  review: string | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  created_at: string;
  updated_at: string;
}

export function useUserCourseRating(courseId: string | undefined, userId: string | undefined) {
  const result = useQuery({
    queryKey: ['user-course-rating', courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      console.log('[useUserCourseRating] queryFn EXECUTING', { courseId, userId });
      if (!courseId || !userId) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('id, rating, review, design_score, condition_score, clubhouse_score, facilities_score, created_at, updated_at')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      console.log('[useUserCourseRating] queryFn RESULT', { 
        hasData: !!data, 
        rating: data?.rating,
        ratingId: data?.id 
      });
      return data as UserCourseRating | null;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  console.log('[useUserCourseRating] Hook called', { 
    courseId, 
    userId, 
    hasData: !!result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    dataUpdatedAt: result.dataUpdatedAt,
    rating: result.data?.rating
  });
  
  return result;
}
