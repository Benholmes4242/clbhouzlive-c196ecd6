
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTop100CoursesList = (region: string, userId: string, isOwnProfile: boolean) => {
  const [playedCourses, setPlayedCourses] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Query to get courses for the specific region using correct filtering
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['top100CoursesByRegion', region],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select(`
          *,
          course_rating_aggregates(avg_overall_score, review_count)
        `);

      // Filter by region based on the primary country selection
      if (region === 'britain-ireland') {
        // Get courses where primary country is "Britain & Ireland" and have regional rankings
        query = query
          .eq('country', 'Britain & Ireland')
          .not('regional_rank', 'is', null)
          .lte('regional_rank', 100)
          .order('regional_rank', { ascending: true });
      } else if (region === 'usa') {
        // Get courses where primary country is "USA" and have regional rankings
        query = query
          .eq('country', 'USA')
          .not('regional_rank', 'is', null)
          .lte('regional_rank', 100)
          .order('regional_rank', { ascending: true });
      } else if (region === 'europe') {
        // Get courses where primary country is "Continental Europe" and have regional rankings
        query = query
          .eq('country', 'Continental Europe')
          .not('regional_rank', 'is', null)
          .lte('regional_rank', 100)
          .order('regional_rank', { ascending: true });
      } else {
        // For 'global', order by global rank
        query = query
          .not('global_rank', 'is', null)
          .order('global_rank');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Flatten course_rating_aggregates to average_rating (only when real reviews exist)
      return (data || []).map(course => {
        const agg = course.course_rating_aggregates?.[0];
        // Only show rating if there are real reviews (review_count > 0)
        const hasRealReviews = agg && agg.review_count > 0;
        return {
          ...course,
          average_rating: hasRealReviews ? agg.avg_overall_score : null,
          review_count: hasRealReviews ? agg.review_count : 0,
        };
      });
    },
    enabled: !!region,
  });

  // Query to get user's rated courses (ratings-only: single source of truth)
  const { data: userPlayedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['userRatedCoursesInRegion', userId, region],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Query to get user's course ratings
  const { data: userRatings = [], isLoading: isLoadingRatings } = useQuery({
    queryKey: ['userCourseRatings', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Update played courses set when data changes
  useEffect(() => {
    const playedSet = new Set(userPlayedCourses.map(pc => pc.course_id));
    setPlayedCourses(playedSet);
  }, [userPlayedCourses]);

  // Toggle course requires rating - redirect to rating flow instead of toggle
  const toggleCourse = async (courseId: string) => {
    if (!isOwnProfile) return;
    
    // With ratings-only system, "toggle" should navigate to rating page
    // This function is kept for backwards compatibility but should be deprecated
    console.warn('toggleCourse is deprecated in ratings-only system. Use rating flow instead.');
  };

  // Helper function to get user rating for a specific course
  const getUserRating = (courseId: string): number | null => {
    const rating = userRatings.find(r => r.course_id === courseId);
    return rating ? rating.rating : null;
  };

  return {
    courses,
    playedCourses,
    userRatings,
    getUserRating,
    isLoading: isLoadingCourses || isLoadingPlayed || isLoadingRatings,
    toggleCourse
  };
};
