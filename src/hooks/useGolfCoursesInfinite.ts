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
      
      // 2. Fetch ratings for these courses (with resilient fallback path)
      if (courses.length === 0) return [] as SearchedCourseWithRating[];

      const courseIds = courses.map(c => c.id);

      // Primary path: direct aggregate table lookup
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('course_rating_aggregates')
        .select('course_id, avg_overall_score, review_count')
        .in('course_id', courseIds);

      // Fallback path: nested relationship from golf_courses (helps when direct aggregate policies differ)
      let normalizedRatings: Array<{ course_id: string; avg_overall_score: number | null; review_count: number | null }> =
        (ratingsData as any[]) || [];

      if (ratingsError || normalizedRatings.length === 0) {
        const { data: fallbackData } = await supabase
          .from('golf_courses')
          .select('id, course_rating_aggregates(avg_overall_score, review_count)')
          .in('id', courseIds);

        normalizedRatings = ((fallbackData || []) as any[])
          .map((row) => {
            const agg = row.course_rating_aggregates?.[0];
            return {
              course_id: row.id,
              avg_overall_score: agg?.avg_overall_score ?? null,
              review_count: agg?.review_count ?? null,
            };
          });
      }

      // 3. Create a map for quick lookup (only treat ratings with real reviews as valid)
      const ratingsMap = new Map<string, number>(
        normalizedRatings
          .filter((r: any) => (r.review_count ?? 0) > 0 && Number.isFinite(Number(r.avg_overall_score)))
          .map((r: any) => [r.course_id, Number(r.avg_overall_score)])
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
