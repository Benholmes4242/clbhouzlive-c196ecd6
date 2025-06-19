
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useTop100CoursesData = (userId: string, isOwnProfile: boolean) => {
  const [regionProgress, setRegionProgress] = useState<Record<string, { played: number; total: number }>>({});

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
            regional_rank
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
        .select('id, continent, country, region, global_rank, regional_rank')
        .or('global_rank.not.is.null,regional_rank.not.is.null') // Include courses with either ranking
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
      
      // Global category includes all courses with global ranks
      if (course.global_rank) {
        progress.global.total++;
        if (isPlayed) progress.global.played++;
      }

      // Regional categorization
      if (course.country === 'United States' && course.global_rank) {
        progress['usa'].total++;
        if (isPlayed) progress['usa'].played++;
      } else if ((course.country === 'United Kingdom' || course.country === 'Ireland') && 
                 (course.global_rank || course.regional_rank)) {
        progress['britain-ireland'].total++;
        if (isPlayed) progress['britain-ireland'].played++;
      } else if (course.continent === 'Europe' && 
                 course.country !== 'United Kingdom' && 
                 course.country !== 'Ireland' && 
                 course.global_rank) {
        progress['europe'].total++;
        if (isPlayed) progress['europe'].played++;
      }
    });

    setRegionProgress(progress);
  }, [allCoursesData, playedCoursesData]);

  const handleVisibilityToggle = async (checked: boolean) => {
    if (!isOwnProfile) return;
    
    const { error } = await supabase
      .from("user_profiles")
      .update({ top100_visible: checked })
      .eq("id", userId);

    if (error) {
      console.error('Error updating top100 visibility:', error);
    }
  };

  return {
    regionProgress,
    isLoading,
    handleVisibilityToggle
  };
};
