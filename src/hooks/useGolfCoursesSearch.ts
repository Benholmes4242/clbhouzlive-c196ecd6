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
}

export function useGolfCoursesSearch(filters: CourseSearchFilters) {
  return useQuery({
    queryKey: ['golf-courses-search', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_golf_courses', {
        search_query: filters.searchQuery || null,
        region_slug: filters.regionSlug || null,
        list_slug: filters.listSlug || null,
        country_filter: filters.countryFilter || null,
        limit_count: filters.limit || 40,
        offset_count: filters.offset || 0,
      });

      if (error) throw error;
      return (data || []) as unknown as SearchedCourse[];
    },
    staleTime: 30 * 60 * 1000,  // 30 min – course list is very stable
    gcTime:   60 * 60 * 1000,  // 60 min – keep around for session
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
