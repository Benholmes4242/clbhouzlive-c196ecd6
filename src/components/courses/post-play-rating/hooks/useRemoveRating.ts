import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Course } from '../types';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';

interface UseRemoveRatingOptions {
  course: Course | null;
  existingRating?: any;
  onSuccess: () => void;
}

export function useRemoveRating({
  course,
  existingRating,
  onSuccess,
}: UseRemoveRatingOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      console.log('[Delete Rating] Payload:', { 
        ratingId: existingRating?.id, 
        courseId: course.id, 
        userId: userResponse.user.id 
      });

      // Delete rating if it exists
      if (existingRating) {
        const { error: ratingError } = await supabase
          .from('course_ratings')
          .delete()
          .eq('id', existingRating.id);
        
        if (ratingError) {
          console.error('[Delete Rating] Rating deletion error:', ratingError);
          throw ratingError;
        }
        console.log('[Delete Rating] Rating deleted successfully');
      }

      // Remove from user_courses (regular courses)
      const { error: courseError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userResponse.user.id)
        .eq('course_id', course.id);
      
      if (courseError && courseError.code !== 'PGRST116') {
        console.error('[Delete Rating] User courses deletion error:', courseError);
      }

      console.log('[Delete Rating] Result:', { status: 'success' });
    },
    onSuccess: async () => {
      console.log('[Delete Rating] onSuccess - starting invalidations');
      
      invalidateCourseRatingCaches(queryClient);
      
      await queryClient.refetchQueries({ queryKey: ['userProfile'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['userTop100Courses'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-played-courses-full'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-top-ten-courses'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['course-personal-status'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-course-moments'], type: 'active', exact: false });

      // Trigger badge checking for the user (non-blocking)
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (userResponse.user) {
          console.log('[Delete Rating] Checking badges for user:', userResponse.user.id);
          await supabase.rpc('check_and_award_badges', { user_id_param: userResponse.user.id });
        }
      } catch (error) {
        console.error('[Delete Rating] Badges check failed but delete succeeded:', error);
      }
      
      console.log('[Delete Rating] onSuccess - showing success state in modal');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('[Delete Rating] Error:', error);
      toast.error("Couldn't remove course", { description: "Please try again" });
    },
  });

  return mutation;
}
