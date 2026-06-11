import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProProfile } from '@/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/proBenchmark';

/**
 * Fetches active tour-pro benchmark rows (read-only via RLS).
 * On any error returns an empty array so the consuming band silently
 * absents itself — never an error surface.
 */
export function useProBenchmarks() {
  return useQuery<ProProfile[]>({
    queryKey: ['pro_benchmarks', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_benchmarks')
        .select(
          'slug, full_name, initials, tour_code, scoring_avg, birdies_per_round, eagles_per_round, tour_cr_baseline',
        )
        .eq('active', true)
        .order('slug');
      if (error) return [];
      return (data ?? []) as ProProfile[];
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
