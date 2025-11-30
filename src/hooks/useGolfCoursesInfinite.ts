import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseSearchFilters, SearchedCourse } from './useGolfCoursesSearch';

const PAGE_SIZE = 25;

export function useGolfCoursesInfinite(filters: Omit<CourseSearchFilters, 'limit' | 'offset'>) {
  return useInfiniteQuery({
    queryKey: ['golf-courses-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('search_golf_courses', {
        search_query: filters.searchQuery || null,
        region_slug: filters.regionSlug || null,
        list_slug: filters.listSlug || null,
        country_filter: filters.countryFilter || null,
        limit_count: PAGE_SIZE,
        offset_count: pageParam * PAGE_SIZE,
      });

      if (error) throw error;
      return (data || []) as unknown as SearchedCourse[];
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
