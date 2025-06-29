
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTop100CoursesData = (userId: string, isOwnProfile: boolean) => {
  const [regionProgress, setRegionProgress] = useState<Record<string, { played: number; total: number }>>({});
  const queryClient = useQueryClient();

  // Query to get the user's played courses from both user_top100_courses and course_ratings
  const { data: playedCoursesData, isLoading } = useQuery({
    queryKey: ['userTop100Courses', userId],
    queryFn: async () => {
      // Get courses from user_top100_courses table
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings table (courses that have been rated are considered played)
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      // Combine both datasets and remove duplicates
      const allPlayedCourses = [...(top100Data || []), ...(ratedData || [])];
      const uniqueCourses = allPlayedCourses.filter((course, index, self) => 
        index === self.findIndex(c => c.course_id === course.course_id)
      );

      console.log('All played courses for user:', userId, uniqueCourses);
      return uniqueCourses || [];
    },
    enabled: !!userId,
  });

  // Query to get all Top 100 courses for calculating progress using correct filtering
  const { data: allCoursesData } = useQuery({
    queryKey: ['allTop100Courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, continent, country, region, global_rank, regional_rank, usa_rank')
        .or('global_rank.not.is.null,regional_rank.not.is.null') // Include courses with any ranking
        .order('global_rank', { nullsFirst: false });

      if (error) throw error;
      console.log('All Top 100 courses:', data);
      return data || [];
    },
  });

  // Calculate progress for each region using correct logic
  useEffect(() => {
    if (!allCoursesData || !playedCoursesData) return;

    const playedCourseIds = new Set(
      playedCoursesData.map(pc => pc.course_id)
    );

    console.log('Played course IDs:', Array.from(playedCourseIds));

    const progress: Record<string, { played: number; total: number }> = {
      'britain-ireland': { played: 0, total: 0 },
      'usa': { played: 0, total: 0 },
      'europe': { played: 0, total: 0 },
      'global': { played: 0, total: 0 }
    };

    // Count total courses and played courses by region using correct filtering
    allCoursesData.forEach(course => {
      const isPlayed = playedCourseIds.has(course.id);
      
      // Global category includes all courses with global ranks (1-100)
      if (course.global_rank && course.global_rank <= 100) {
        progress.global.total++;
        if (isPlayed) progress.global.played++;
      }

      // Regional categories - based on primary country assignment
      if (course.country === 'USA' && course.regional_rank && course.regional_rank <= 100) {
        progress['usa'].total++;
        if (isPlayed) progress['usa'].played++;
      } else if (course.country === 'Britain & Ireland' && course.regional_rank && course.regional_rank <= 100) {
        progress['britain-ireland'].total++;
        if (isPlayed) progress['britain-ireland'].played++;
      } else if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
        progress['europe'].total++;
        if (isPlayed) {
          console.log('Continental Europe course marked as played:', course);
          progress['europe'].played++;
        }
      }
    });

    console.log('Final progress calculation:', progress);
    setRegionProgress(progress);
  }, [allCoursesData, playedCoursesData]);

  const handleVisibilityToggle = async (checked: boolean) => {
    if (!isOwnProfile) return;
    
    console.log('handleVisibilityToggle called with:', checked);
    
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ top100_visible: checked })
        .eq("id", userId);

      if (error) {
        console.error('Error updating top100 visibility:', error);
        throw error;
      }

      console.log('Successfully updated top100_visible to:', checked);

      // Invalidate the profile query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      
    } catch (error) {
      console.error('Error updating top100 visibility:', error);
    }
  };

  return {
    regionProgress,
    isLoading,
    handleVisibilityToggle
  };
};
