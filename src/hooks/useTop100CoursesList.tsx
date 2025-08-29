
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
        .select('*');

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

      return data || [];
    },
    enabled: !!region,
  });

  // Query to get user's played courses and ratings
  const { data: userPlayedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['userTop100CoursesInRegion', userId, region],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select('course_id')
        .eq('user_id', userId)
        .eq('played', true);

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

  // Update played courses set when data changes - include both played and rated courses
  useEffect(() => {
    const playedSet = new Set(userPlayedCourses.map(pc => pc.course_id));
    // Also include courses that have been rated by the user
    userRatings.forEach(rating => playedSet.add(rating.course_id));
    setPlayedCourses(playedSet);
  }, [userPlayedCourses, userRatings]);

  const toggleCourse = async (courseId: string) => {
    if (!isOwnProfile) return;

    const isCurrentlyPlayed = playedCourses.has(courseId);
    
    // Optimistically update UI
    const newPlayedCourses = new Set(playedCourses);
    if (isCurrentlyPlayed) {
      newPlayedCourses.delete(courseId);
    } else {
      newPlayedCourses.add(courseId);
    }
    setPlayedCourses(newPlayedCourses);

    try {
      if (isCurrentlyPlayed) {
        // Remove the course
        await supabase
          .from('user_top100_courses')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId);
      } else {
        // Add the course
        await supabase
          .from('user_top100_courses')
          .insert({
            user_id: userId,
            course_id: courseId,
            played: true,
            played_date: new Date().toISOString().split('T')[0]
          });
      }

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['userTop100Courses', userId] });
      queryClient.invalidateQueries({ queryKey: ['userTop100CoursesInRegion', userId, region] });
      
    } catch (error) {
      console.error('Error toggling course:', error);
      // Revert optimistic update on error
      setPlayedCourses(playedCourses);
    }
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
