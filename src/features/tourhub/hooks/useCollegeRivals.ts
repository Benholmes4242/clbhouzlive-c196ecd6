import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCollegeMediaMap, type CollegeMedia } from './useCollegeMedia';

export interface CollegeRival {
  normalized_name: string;
  weight: number;
  media: CollegeMedia | null;
}

/**
 * Fetches rival colleges from the college_rivalries table.
 */
export function useCollegeRivals(collegeSlug: string | undefined) {
  const { data: collegeMap } = useCollegeMediaMap();

  return useQuery({
    queryKey: ['college-rivals', collegeSlug],
    queryFn: async (): Promise<CollegeRival[]> => {
      if (!collegeSlug) return [];

      // Fetch rivalries where this college is either side
      const [asA, asB] = await Promise.all([
        supabase
          .from('college_rivalries')
          .select('college_b, weight')
          .eq('college_a', collegeSlug)
          .order('weight', { ascending: false })
          .limit(5),
        supabase
          .from('college_rivalries')
          .select('college_a, weight')
          .eq('college_b', collegeSlug)
          .order('weight', { ascending: false })
          .limit(5),
      ]);

      const rivals: CollegeRival[] = [];
      const seen = new Set<string>();

      for (const row of asA.data || []) {
        if (!seen.has(row.college_b)) {
          seen.add(row.college_b);
          rivals.push({
            normalized_name: row.college_b,
            weight: row.weight,
            media: collegeMap?.get(row.college_b) || null,
          });
        }
      }
      for (const row of asB.data || []) {
        if (!seen.has(row.college_a)) {
          seen.add(row.college_a);
          rivals.push({
            normalized_name: row.college_a,
            weight: row.weight,
            media: collegeMap?.get(row.college_a) || null,
          });
        }
      }

      // Sort by weight descending
      rivals.sort((a, b) => b.weight - a.weight);
      return rivals.slice(0, 5);
    },
    enabled: !!collegeSlug && !!collegeMap,
    staleTime: 10 * 60 * 1000,
  });
}
