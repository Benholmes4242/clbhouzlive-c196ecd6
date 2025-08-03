import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface RegionalProgress {
  linksLegend: number;
  continentalSwinger: number;
  starsStripes: number;
  totalPlayed: number;
}

export const useUserAchievements = () => {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async (): Promise<RegionalProgress> => {
      if (!user?.id) {
        return {
          linksLegend: 0,
          continentalSwinger: 0,
          starsStripes: 0,
          totalPlayed: 0
        };
      }

      // Get all courses the user has played
      const { data: userCourses, error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played,
          golf_courses (
            country,
            continent,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('user_id', user.id)
        .eq('played', true);

      if (error) {
        console.error('Error fetching user achievements:', error);
        return {
          linksLegend: 0,
          continentalSwinger: 0,
          starsStripes: 0,
          totalPlayed: 0
        };
      }

      let linksLegend = 0;
      let continentalSwinger = 0;
      let starsStripes = 0;
      let totalPlayed = 0;

      userCourses?.forEach((userCourse) => {
        const course = userCourse.golf_courses;
        if (!course) return;

        // Count courses that are in any top 100 ranking
        const isTop100 = course.global_rank || course.regional_rank || course.usa_rank;
        if (isTop100) {
          totalPlayed++;

          // Links Legend - Britain & Ireland courses
          if (course.country === 'Britain & Ireland') {
            linksLegend++;
          }
          
          // Continental Swinger - Continental Europe courses with regional ranking
          if (course.country === 'Continental Europe' && course.regional_rank) {
            continentalSwinger++;
          }
          
          // Stars & Stripes Tourer - USA courses
          if (course.country === 'USA') {
            starsStripes++;
          }
        }
      });

      return {
        linksLegend,
        continentalSwinger,
        starsStripes,
        totalPlayed
      };
    },
    enabled: !!user?.id
  });
};