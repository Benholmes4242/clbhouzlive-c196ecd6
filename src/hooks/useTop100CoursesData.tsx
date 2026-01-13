
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTop100CoursesData = (userId: string, isOwnProfile: boolean) => {
  const [regionProgress, setRegionProgress] = useState<Record<string, { played: number; total: number }>>({});
  const queryClient = useQueryClient();

  // Query to get the user's rated courses (ratings-only: single source of truth)
  const { data: playedCoursesData, isLoading } = useQuery({
    queryKey: ['userTop100Courses', userId],
    queryFn: async () => {
      // Get courses from course_ratings table (ratings = played)
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

      return ratedData || [];
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
      return data || [];
    },
  });

  // Calculate progress for each region using correct logic
  useEffect(() => {
    if (!allCoursesData || !playedCoursesData) return;

    const playedCourseIds = new Set(
      playedCoursesData.map(pc => pc.course_id)
    );

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
        if (isPlayed) progress['europe'].played++;
      }
    });

    setRegionProgress(progress);
  }, [allCoursesData, playedCoursesData]);

  const handleVisibilityToggle = async (checked: boolean) => {
    if (!isOwnProfile) return;
    
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ top100_visible: checked })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      // Invalidate the profile query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      
    } catch (error) {
      // Error is thrown and handled by caller
      throw error;
    }
  };

  return {
    regionProgress,
    isLoading,
    handleVisibilityToggle
  };
};
