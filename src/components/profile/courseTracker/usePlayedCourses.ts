
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlayedCourse } from "./types";

export const usePlayedCourses = (userId?: string, selectedCategory?: string | null) => {
  return useQuery({
    queryKey: ['playedCourses', userId, selectedCategory],
    queryFn: async (): Promise<PlayedCourse[]> => {
      if (!userId || !selectedCategory) return [];
      
      console.log('Fetching played courses for user:', userId, 'category:', selectedCategory);
      
      const { data, error } = await supabase
        .from('user_course_tracker')
        .select(`
          *,
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
        .eq('checked', true);

      if (error) {
        console.error('Error fetching played courses:', error);
        throw error;
      }
      
      console.log('All played courses for user:', data);
      
      // Filter by category based on ranks
      const filtered = data?.filter(course => {
        const golfCourse = course.golf_courses;
        if (!golfCourse) {
          console.log('No golf course data for course:', course.course_id);
          return false;
        }
        
        console.log('Processing course for category filter:', golfCourse.name, {
          category: selectedCategory,
          global_rank: golfCourse.global_rank,
          regional_rank: golfCourse.regional_rank,
          country: golfCourse.country,
          continent: golfCourse.continent
        });
        
        switch (selectedCategory) {
          case 'Global':
            const isGlobal = golfCourse.global_rank && golfCourse.global_rank <= 100;
            console.log('Global check for', golfCourse.name, ':', isGlobal);
            return isGlobal;
          case 'GB&I':
            const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
            const isGBI = golfCourse.regional_rank && golfCourse.regional_rank <= 100 && 
                   gbiCountries.includes(golfCourse.country);
            console.log('GB&I check for', golfCourse.name, ':', isGBI);
            return isGBI;
          case 'Europe':
            const gbiCountriesForEurope = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
            const isEurope = golfCourse.regional_rank && golfCourse.regional_rank <= 100 && 
                   golfCourse.continent === 'Europe' && 
                   !gbiCountriesForEurope.includes(golfCourse.country);
            console.log('Europe check for', golfCourse.name, ':', isEurope);
            return isEurope;
          case 'USA':
            const isUSA = golfCourse.regional_rank && golfCourse.regional_rank <= 100 && 
                   golfCourse.country === 'United States';
            console.log('USA check for', golfCourse.name, ':', isUSA);
            return isUSA;
          default:
            return false;
        }
      }) || [];
      
      console.log('Filtered courses for category', selectedCategory, ':', filtered);
      return filtered;
    },
    enabled: !!userId && !!selectedCategory,
    // Add a shorter stale time to ensure fresh data
    staleTime: 30000, // 30 seconds
  });
};
