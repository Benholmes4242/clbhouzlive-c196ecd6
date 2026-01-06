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
          const userId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;
          
          if (courseId) {
            // Invalidate the specific course's aggregates
            queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });

            // If those screens are currently open, refetch immediately
            void queryClient.refetchQueries({ queryKey: ['course-rating-aggregates', courseId], type: 'active' });
            void queryClient.refetchQueries({ queryKey: ['course-rating-stats', courseId], type: 'active' });
            void queryClient.refetchQueries({ queryKey: ['course-reviews-full', courseId], type: 'active' });
            void queryClient.refetchQueries({ queryKey: ['course-detail', courseId], type: 'active' });
          }
          
          // Invalidate Top 10 carousel ratings (uses user-course-ratings-breakdown query)
          // This ensures the Top 10 section shows updated ratings in real-time
          if (userId) {
            queryClient.invalidateQueries({ 
              queryKey: ['user-course-ratings-breakdown', userId], 
              exact: false 
            });
            // Invalidate Course History queries so rating changes reflect immediately
            queryClient.invalidateQueries({ 
              queryKey: ['user-course-activity', userId], 
              exact: false 
            });
            queryClient.invalidateQueries({ 
              queryKey: ['user-played-courses-full', userId], 
              exact: false 
            });
            // Refetch even if the query is currently inactive (e.g. user updates a rating on a course page,
            // then navigates back to profile). Our app often uses refetchOnMount=false for perf.
            void queryClient.refetchQueries({ 
              queryKey: ['user-course-ratings-breakdown', userId], 
              exact: false,
              type: 'all',
            });
            void queryClient.refetchQueries({ 
              queryKey: ['user-course-activity', userId], 
              exact: false,
              type: 'all',
            });
            void queryClient.refetchQueries({ 
              queryKey: ['user-played-courses-full', userId], 
              exact: false,
              type: 'all',
            });
          }
          // Also invalidate with fuzzy match for any active breakdown queries
          queryClient.invalidateQueries({ 
            queryKey: ['user-course-ratings-breakdown'], 
            exact: false 
          });
          // Invalidate all course activity queries (for any user viewing profiles)
          queryClient.invalidateQueries({ 
            queryKey: ['user-course-activity'], 
            exact: false 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['user-played-courses-full'], 
            exact: false 
          });
          
          // Invalidate feed queries so cards update
          queryClient.invalidateQueries({ queryKey: ['explore-courses'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['golf-courses-infinite'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['top100CoursesByRegion'], exact: false });

          // Force-refresh any currently visible feeds (perf-tuning sets refetchOnMount=false)
          void queryClient.refetchQueries({ queryKey: ['explore-courses'], exact: false, type: 'active' });
          void queryClient.refetchQueries({ queryKey: ['golf-courses-infinite'], exact: false, type: 'active' });
          void queryClient.refetchQueries({ queryKey: ['top100CoursesByRegion'], exact: false, type: 'active' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
