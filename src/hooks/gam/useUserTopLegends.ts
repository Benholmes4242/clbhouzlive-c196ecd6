import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegendCategory } from '@/lib/gam/types';

export interface TopLegendRow {
  id: string;
  category: LegendCategory;
  rank: number;
  value: number;
  course_id: string;
  course_name: string;
  attained_at: string;
}

interface Options {
  /** Max rows to return. Default 3. */
  limit?: number;
  /** Only include rows where rank <= maxRank. Default 3. */
  maxRank?: number;
}

/**
 * Fetches a viewer's top Course Legend positions from `gam_course_legends_view`
 * (the display view that joins `golf_courses` for `course_name`).
 *
 * Parameterised so file 03's sheet can reuse it for the full top-10 list.
 */
export function useUserTopLegends(userId: string | undefined, options: Options = {}) {
  const { limit = 3, maxRank = 3 } = options;
  return useQuery({
    queryKey: ['gam', 'user-top-legends', userId, limit, maxRank],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<TopLegendRow[]> => {
      const { data, error } = await supabase
        .from('gam_course_legends_view')
        .select('id, category, rank, value, course_id, course_name, attained_at')
        .eq('user_id', userId!)
        .eq('is_current', true)
        .lte('rank', maxRank)
        .order('rank', { ascending: true })
        .order('attained_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id ?? '',
        category: r.category as LegendCategory,
        rank: r.rank ?? 0,
        value: r.value ?? 0,
        course_id: r.course_id ?? '',
        course_name: r.course_name ?? 'a course',
        attained_at: r.attained_at ?? '',
      }));
    },
  });
}
