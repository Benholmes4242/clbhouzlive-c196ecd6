import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface RegionalProgress {
  linksLegend: number;
  continentalSwinger: number;
  starsStripes: number;
  totalPlayed: number;
}

export const useUserAchievements = (targetUserId?: string) => {
  const { user } = useSupabaseSession();
  
  // Use targetUserId if provided, otherwise use current user's ID
  const userId = targetUserId || user?.id;

  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async (): Promise<RegionalProgress> => {
      if (!userId) {
        return {
          linksLegend: 0,
          continentalSwinger: 0,
          starsStripes: 0,
          totalPlayed: 0
        };
      }

      // Get courses from user_top100_courses table
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          golf_courses (
            name,
            country,
            continent,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings table (rated courses are considered played)
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          golf_courses (
            name,
            country,
            continent,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      // Combine both datasets and remove duplicates (same logic as useTop100CoursesData)
      const allPlayedCourses = [...(top100Data || []), ...(ratedData || [])];
      const userCourses = allPlayedCourses.filter((course, index, self) => 
        index === self.findIndex(c => c.course_id === course.course_id)
      );

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
          
          // Stars & Stripes Tourer - USA courses
          if (course.country === 'USA') {
            starsStripes++;
          }
        }

        // Continental Swinger - Continental Europe courses with regional ranking <= 100 (matches the tile logic exactly)
        if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
          continentalSwinger++;
        }
      });

      return {
        linksLegend,
        continentalSwinger,
        starsStripes,
        totalPlayed
      };
    },
    enabled: !!userId
  });
};