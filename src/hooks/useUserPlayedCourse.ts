import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';

/**
 * Ratings-only hook: "played" = has a rating in course_ratings
 */
export function useUserPlayedCourse(courseId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: hasPlayed, isLoading } = useQuery({
    queryKey: ['user-played-course', courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      if (!courseId || !userId) return false;

      // Check if user has a rating for this course (ratings-only system)
      const { data, error } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
  });

  const removeRatingMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !userId) throw new Error('Missing courseId or userId');

      // Remove rating to mark as not played (ratings-only system)
      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      invalidateCourseRatingCaches(queryClient);

      // Force refetch critical profile queries
      await queryClient.refetchQueries({ queryKey: ['userProfile'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['userTop100Courses'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-played-courses-full'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-top-ten-courses'], type: 'active', exact: false });
    },
  });

  return {
    hasPlayed: hasPlayed || false,
    isLoading,
    removeRating: removeRatingMutation.mutate,
    isRemoving: removeRatingMutation.isPending,
  };
}
