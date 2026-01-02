import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseSearchFilters, SearchedCourse } from './useGolfCoursesSearch';

/**
 * Page size for infinite scroll fetching.
 * Set to 100 to fetch complete Top 100 lists in a single request.
 */
const PAGE_SIZE = 100;

// Extended type that includes rating
export interface SearchedCourseWithRating extends SearchedCourse {
  average_rating?: number | null;
}

export function useGolfCoursesInfinite(filters: Omit<CourseSearchFilters, 'limit' | 'offset'>) {
  return useInfiniteQuery({
    queryKey: ['golf-courses-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // 1. Fetch courses from RPC
      const { data, error } = await supabase.rpc('search_golf_courses', {
        search_query: filters.searchQuery || null,
        region_slug: filters.regionSlug || null,
        list_slug: filters.listSlug || null,
        country_filter: filters.countryFilter || null,
        limit_count: PAGE_SIZE,
        offset_count: pageParam * PAGE_SIZE,
      });

      if (error) throw error;
      
      const courses = (data || []) as unknown as SearchedCourse[];
      
      // 2. Fetch ratings for these courses
      if (courses.length === 0) return [] as SearchedCourseWithRating[];
      
      const courseIds = courses.map(c => c.id);
      const { data: ratingsData } = await supabase
        .from('course_rating_aggregates')
        .select('course_id, avg_overall_score')
        .in('course_id', courseIds);
      
      // 3. Create a map for quick lookup
      const ratingsMap = new Map<string, number>(
        (ratingsData || []).map((r: any) => [r.course_id, r.avg_overall_score])
      );
      
      // 4. Merge ratings into courses
      return courses.map(course => ({
        ...course,
        average_rating: ratingsMap.get(course.id) ?? null,
      })) as SearchedCourseWithRating[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than PAGE_SIZE, we're done
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    refetchOnWindowFocus: false,
  });
}
