import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChartCohort, TenChart } from './clbhouzTenRules';
/** Public chart only: one RPC, no browser ranking, voter reconstruction or fallback reads. */
export function useClbhouzTenChart(cohort: ChartCohort, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['clbhouz-ten', cohort, limit], staleTime: 10 * 60 * 1000, enabled,
    queryFn: async (): Promise<TenChart | null> => {
      const { data, error } = await supabase.rpc('get_top_ten_chart', { p_cohort: cohort, p_limit: limit });
      if (error) throw error;
      return data as unknown as TenChart | null;
    },
  });
}
