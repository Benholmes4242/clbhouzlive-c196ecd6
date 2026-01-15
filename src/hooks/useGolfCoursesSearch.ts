import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseSearchFilters {
  searchQuery?: string;
  regionSlug?: string;
  listSlug?: string;
  countryFilter?: string;
  limit?: number;
  offset?: number;
}

export interface CourseListMembership {
  list_id: string;
  list_slug: string;
  list_name: string;
  rank: number;
}

export interface SearchedCourse {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  region?: string;
  continent?: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
  country_rank?: number;
  thumbnail_image?: string;
  description?: string;
  website_url?: string;
  latitude?: number;
  longitude?: number;
  top100_url?: string;
  created_at: string;
  updated_at: string;
  list_memberships: CourseListMembership[];
  // Community rating from course_rating_aggregates
  average_rating?: number | null;
}

export function useGolfCoursesSearch(filters: CourseSearchFilters) {
  return useQuery({
    queryKey: ['golf-courses-search', filters],
    queryFn: async () => {
      // 1. Fetch courses from RPC
      const { data, error } = await supabase.rpc('search_golf_courses', {
        search_query: filters.searchQuery || null,
        region_slug: filters.regionSlug || null,
        list_slug: filters.listSlug || null,
        country_filter: filters.countryFilter || null,
        limit_count: filters.limit || 40,
        offset_count: filters.offset || 0,
      });

      if (error) throw error;
      
      const courses = (data || []) as unknown as SearchedCourse[];
      
      // 2. Fetch ratings for these courses
      if (courses.length === 0) return [] as SearchedCourse[];
      
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
      })) as SearchedCourse[];
    },
    staleTime: 5 * 60 * 1000,  // 5 min - consistent with other rating queries
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
