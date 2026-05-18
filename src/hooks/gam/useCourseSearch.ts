import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseSearchResult {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  course_type: string | null;
}

/**
 * Lightweight ILIKE search against `golf_courses` for the Legends tab search bar.
 * Min query length 2; capped at 20 results; 30s staleTime.
 *
 * Perf note: relies on the existing `name` index. If we hit scale issues at
 * 50k+ courses, add a `pg_trgm` GIN index on `name` (captured as follow-up).
 */
export function useCourseSearch(query: string) {
  const q = query.trim();
  const enabled = q.length >= 2;
  return useQuery({
    queryKey: ['gam', 'course-search', q.toLowerCase()],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<CourseSearchResult[]> => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, country, course_type')
        .ilike('name', `%${q}%`)
        .order('name', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as CourseSearchResult[];
    },
  });
}
