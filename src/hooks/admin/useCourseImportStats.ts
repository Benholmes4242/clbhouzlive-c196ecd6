import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseImportStats {
  totalCourses: number;
  recentlyImported: number;
  lastImportDate: string | null;
  coursesWithoutCoordinates: number;
  coursesWithoutImages: number;
}

export function useCourseImportStats() {
  return useQuery({
    queryKey: ['course-import-stats'],
    queryFn: async (): Promise<CourseImportStats> => {
      // Get total courses
      const { count: totalCourses } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true });

      // Get recently imported (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentlyImported, data: recentData } = await supabase
        .from('golf_courses')
        .select('created_at', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      // Get last import date
      const { data: lastCourse } = await supabase
        .from('golf_courses')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get courses without coordinates
      const { count: noCoordinates } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .or('latitude.is.null,longitude.is.null');

      // Get courses without images (using default image or null)
      const { count: noImages } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .or('thumbnail_image.is.null,thumbnail_image.ilike.%unsplash%');

      return {
        totalCourses: totalCourses || 0,
        recentlyImported: recentlyImported || 0,
        lastImportDate: lastCourse?.created_at || null,
        coursesWithoutCoordinates: noCoordinates || 0,
        coursesWithoutImages: noImages || 0,
      };
    },
    staleTime: 30000,
  });
}
