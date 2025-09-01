
import { useOptimizedInfiniteQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { GolfCourse, RegionalFilter } from './types';

interface UseGolfCoursesOptions {
  regionalFilter: RegionalFilter;
  searchTerm: string;
}

const PAGE_SIZE = 50;

export const useGolfCourses = ({ regionalFilter, searchTerm }: UseGolfCoursesOptions) => {
  return useOptimizedInfiniteQuery({
    queryKey: ['admin-golf-courses', regionalFilter, searchTerm],
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      const offset = (pageParam as number) || 0;
      
      let query = supabase
        .from('golf_courses')
        .select('*', { count: 'exact' });

      // Apply server-side filtering
      if (regionalFilter.top100List) {
        // Top 100 filtering
        switch (regionalFilter.top100List) {
          case 'worldwide':
            query = query.not('global_rank', 'is', null).lte('global_rank', 100);
            break;
          case 'usa':
            query = query.not('usa_rank', 'is', null).lte('usa_rank', 100);
            break;
          case 'britain-ireland':
            query = query.not('regional_rank', 'is', null).lte('regional_rank', 100).eq('country', 'Britain & Ireland');
            break;
          case 'europe':
            query = query.not('regional_rank', 'is', null).lte('regional_rank', 100).eq('country', 'Continental Europe');
            break;
        }
      } else {
        // Regional scope filtering
        if (regionalFilter.scope !== 'all') {
          switch (regionalFilter.scope) {
            case 'britain-ireland':
              query = query.eq('country', 'Britain & Ireland');
              break;
            case 'usa':
              query = query.eq('country', 'USA');
              break;
            case 'europe':
              query = query.eq('country', 'Continental Europe');
              break;
          }
        }
      }

      // Apply sub-country filter
      if (regionalFilter.subCountry) {
        query = query.eq('sub_country', regionalFilter.subCountry);
      }

      // Apply county filter
      if (regionalFilter.county) {
        query = query.eq('region', regionalFilter.county);
      }

      // Apply search term
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,sub_country.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      switch (regionalFilter.sortBy) {
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        case 'recent-added':
          query = query.order('id', { ascending: false });
          break;
        default: // name-asc
          query = query.order('name', { ascending: true });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        courses: data as GolfCourse[],
        nextCursor: data && data.length === PAGE_SIZE ? offset + PAGE_SIZE : undefined,
        totalCount: count || 0,
        currentOffset: offset
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000, // 10 minutes for admin data
    dedupe: true,
  });
};
