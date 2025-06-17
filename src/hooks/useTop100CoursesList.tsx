
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTop100CoursesList = (region: string, userId: string, isOwnProfile: boolean) => {
  const [playedCourses, setPlayedCourses] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Query to get courses for the specific region
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['top100CoursesByRegion', region],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*')
        .not('global_rank', 'is', null)
        .order('global_rank');

      // Filter by region
      if (region === 'great-britain-ireland') {
        query = query.in('country', ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland']);
      } else if (region === 'north-america') {
        query = query.eq('continent', 'North America');
      } else if (region === 'europe') {
        query = query
          .eq('continent', 'Europe')
          .not('country', 'in', '("Scotland","England","Wales","Northern Ireland","Ireland")');
      }
      // For 'global', no additional filter needed

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!region,
  });

  // Query to get user's played courses
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

  // Update played courses set when data changes
  useEffect(() => {
    const playedSet = new Set(userPlayedCourses.map(pc => pc.course_id));
    setPlayedCourses(playedSet);
  }, [userPlayedCourses]);

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

  return {
    courses,
    playedCourses,
    isLoading: isLoadingCourses || isLoadingPlayed,
    toggleCourse
  };
};
