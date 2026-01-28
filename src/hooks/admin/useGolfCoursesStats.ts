import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GolfCoursesStats {
  totalCourses: number;
  verifiedCourses: number;
  coursesWithRatings: number;
  missingCoordinates: number;
  missingImages: number;
  recentlyAdded: number;
}

export function useGolfCoursesStats() {
  return useQuery({
    queryKey: ['admin-golf-courses-stats'],
    queryFn: async (): Promise<GolfCoursesStats> => {
      // Get total count
      const { count: totalCourses } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true });

      // Get courses missing coordinates
      const { count: missingCoordinates } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .or('latitude.is.null,longitude.is.null');

      // Get courses missing images
      const { count: missingImages } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .is('thumbnail_image', null);

      // Get courses with ratings (distinct course_ids in course_ratings)
      const { data: ratedCourses } = await supabase
        .from('course_ratings')
        .select('course_id')
        .limit(10000);
      
      const uniqueRatedCourses = new Set(ratedCourses?.map(r => r.course_id) || []);

      // Get courses added in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentlyAdded } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get verified courses (courses with any rank)
      const { count: verifiedCourses } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .or('global_rank.not.is.null,usa_rank.not.is.null,regional_rank.not.is.null');

      return {
        totalCourses: totalCourses || 0,
        verifiedCourses: verifiedCourses || 0,
        coursesWithRatings: uniqueRatedCourses.size,
        missingCoordinates: missingCoordinates || 0,
        missingImages: missingImages || 0,
        recentlyAdded: recentlyAdded || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
