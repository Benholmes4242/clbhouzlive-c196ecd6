import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiscoverCourseRow {
  course_id: string;
  course_name: string;
  course_region: string | null;
  course_country: string | null;
  course_type: string | null;
  recent_legend_count?: number | null;
}

/**
 * Backed by the future RPC `get_discover_courses_this_week`. Returns empty on
 * RPC error so the UI renders the empty stub.
 */
export function useDiscoverCoursesThisWeek() {
  return useQuery({
    queryKey: ['gam', 'discover-courses-this-week'],
    staleTime: 60_000,
    queryFn: async (): Promise<DiscoverCourseRow[]> => {
      const { data, error } = await (supabase.rpc as any)('get_discover_courses_this_week', { p_limit: 24 });
      if (error) return [];
      return (data ?? []) as DiscoverCourseRow[];
    },
  });
}
