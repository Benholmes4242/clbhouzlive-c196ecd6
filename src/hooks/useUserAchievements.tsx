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
      console.log('useUserAchievements - Starting query for user:', user?.id);
      
      if (!user?.id) {
        console.log('useUserAchievements - No user ID, returning zeros');
        return {
          linksLegend: 0,
          continentalSwinger: 0,
          starsStripes: 0,
          totalPlayed: 0
        };
      }

      console.log('useUserAchievements - Fetching data for user:', user.id);

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
        .eq('user_id', user.id)
        .eq('played', true);

      if (top100Error) {
        console.error('useUserAchievements - Error fetching top100 courses:', top100Error);
        throw top100Error;
      }

      console.log('useUserAchievements - Top100 courses:', top100Data);

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
        .eq('user_id', user.id);

      if (ratedError) {
        console.error('useUserAchievements - Error fetching rated courses:', ratedError);
        throw ratedError;
      }

      console.log('useUserAchievements - Rated courses:', ratedData);

      // Combine both datasets and remove duplicates (same logic as useTop100CoursesData)
      const allPlayedCourses = [...(top100Data || []), ...(ratedData || [])];
      const userCourses = allPlayedCourses.filter((course, index, self) => 
        index === self.findIndex(c => c.course_id === course.course_id)
      );

      console.log('useUserAchievements - Combined unique courses:', userCourses);

      let linksLegend = 0;
      let continentalSwinger = 0;
      let starsStripes = 0;
      let totalPlayed = 0;

      console.log('useUserAchievements - Processing courses...');
      
      userCourses?.forEach((userCourse) => {
        const course = userCourse.golf_courses;
        if (!course) {
          console.log('useUserAchievements - Skipping course with no golf_courses data');
          return;
        }

        console.log('useUserAchievements - Processing course:', course.name, 'Country:', course.country, 'Regional rank:', course.regional_rank);

        // Count courses that are in any top 100 ranking
        const isTop100 = course.global_rank || course.regional_rank || course.usa_rank;
        if (isTop100) {
          totalPlayed++;

          // Links Legend - Britain & Ireland courses
          if (course.country === 'Britain & Ireland') {
            console.log('useUserAchievements - Found GB&I course:', course.name);
            linksLegend++;
          }
          
          // Stars & Stripes Tourer - USA courses
          if (course.country === 'USA') {
            console.log('useUserAchievements - Found USA course:', course.name);
            starsStripes++;
          }
        }

        // Continental Swinger - Continental Europe courses with regional ranking <= 100 (matches the tile logic exactly)
        if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
          console.log('useUserAchievements - Found Continental Europe course for achievements:', course.name, course.regional_rank);
          continentalSwinger++;
        }
      });

      console.log('useUserAchievements - Final achievement counts:', { linksLegend, continentalSwinger, starsStripes, totalPlayed });

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