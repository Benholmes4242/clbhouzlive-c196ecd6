import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const togglePlayedMutation = useMutation({
    mutationFn: async ({ played }: { played: boolean }) => {
      if (!courseId || !userId) throw new Error('Missing courseId or userId');

      if (played) {
        // In ratings-only system, marking as played requires creating a rating
        // This is typically done through the rating modal, not directly here
        throw new Error('Use PostPlayRatingModal to add courses');
      } else {
        // Remove rating to mark as not played
        const { error } = await supabase
          .from('course_ratings')
          .delete()
          .eq('course_id', courseId)
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-played-course', courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-activity', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-courses', userId] });
      queryClient.invalidateQueries({ queryKey: ['course-ratings'] });
    },
  });

  return {
    hasPlayed: hasPlayed || false,
    isLoading,
    togglePlayed: togglePlayedMutation.mutate,
    isToggling: togglePlayedMutation.isPending,
  };
}
