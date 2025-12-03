import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useToggleCourseShortlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { courseId: string; currentlyShortlisted: boolean }) => {
      const { courseId, currentlyShortlisted } = params;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (currentlyShortlisted) {
        const { error } = await supabase
          .from('course_shortlists')
          .delete()
          .eq('course_id', courseId)
          .eq('user_id', user.id);

        if (error) throw error;
        return { courseId, nextState: false };
      }

      const { error } = await supabase
        .from('course_shortlists')
        .insert({ course_id: courseId, user_id: user.id });

      if (error && error.code !== '23505') {
        throw error;
      }

      return { courseId, nextState: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-course-shortlist'] });
      qc.invalidateQueries({ queryKey: ['top100-course-leaderboard'] });
    },
  });
}
