import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserPlayedCourse(courseId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: hasPlayed, isLoading } = useQuery({
    queryKey: ['user-played-course', courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      if (!courseId || !userId) return false;

      const { data, error } = await supabase
        .from('user_top100_courses')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return !!data;
    },
  });

  const togglePlayedMutation = useMutation({
    mutationFn: async ({ played }: { played: boolean }) => {
      if (!courseId || !userId) throw new Error('Missing courseId or userId');

      if (played) {
        // Add to played courses
        const { error } = await supabase
          .from('user_top100_courses')
          .insert({
            course_id: courseId,
            user_id: userId,
            played_date: new Date().toISOString(),
          });
        if (error) throw error;
      } else {
        // Remove from played courses
        const { error } = await supabase
          .from('user_top100_courses')
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
    },
  });

  return {
    hasPlayed: hasPlayed || false,
    isLoading,
    togglePlayed: togglePlayedMutation.mutate,
    isToggling: togglePlayedMutation.isPending,
  };
}
