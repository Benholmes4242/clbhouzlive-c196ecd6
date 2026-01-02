import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time listener for course_ratings changes.
 * When any rating changes, invalidates related queries so cards/lists refresh.
 */
export function useCourseRatingsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('rt:course-ratings-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_ratings' },
        (payload) => {
          const courseId = (payload.new as any)?.course_id || (payload.old as any)?.course_id;
          
          if (courseId) {
            // Invalidate the specific course's aggregates
            queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
          }
          
          // Invalidate feed queries so cards update
          queryClient.invalidateQueries({ queryKey: ['explore-courses'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['golf-courses-infinite'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
