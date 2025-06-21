
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTop100CoursesData = (userId: string, isOwnProfile: boolean) => {
  const [regionProgress, setRegionProgress] = useState<Record<string, { played: number; total: number }>>({});
  const queryClient = useQueryClient();

  // Query to get the user's played courses
  const { data: playedCoursesData, isLoading } = useQuery({
    queryKey: ['userTop100Courses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Query to get all Top 100 courses for calculating progress
  const { data: allCoursesData } = useQuery({
    queryKey: ['allTop100Courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, continent, country, region, global_rank, regional_rank, usa_rank')
        .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null') // Include courses with any ranking
        .order('global_rank', { nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate progress for each region
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

    // Count total courses and played courses by region
    allCoursesData.forEach(course => {
      const isPlayed = playedCourseIds.has(course.id);
      
      // Global category includes all courses with global ranks (1-100)
      if (course.global_rank && course.global_rank <= 100) {
        progress.global.total++;
        if (isPlayed) progress.global.played++;
      }

      // USA category - courses with USA ranks (1-100)
      if (course.country === 'United States' && course.usa_rank && course.usa_rank <= 100) {
        progress['usa'].total++;
        if (isPlayed) progress['usa'].played++;
      }
      
      // Britain & Ireland category - courses with regional ranks (1-100)
      else if (['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Isle of Man'].includes(course.country) && 
               course.regional_rank && course.regional_rank <= 100) {
        progress['britain-ireland'].total++;
        if (isPlayed) progress['britain-ireland'].played++;
      }
      
      // Continental Europe category - European courses with global ranks
      else if (course.continent === 'Europe' && 
               !['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Isle of Man'].includes(course.country) &&
               course.global_rank) {
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
        console.error('Error updating top100 visibility:', error);
        throw error;
      }

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
