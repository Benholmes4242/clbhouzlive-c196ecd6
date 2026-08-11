import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_admin_retention - DAU 8 says nothing about whether it is the same 8
 * people every day. That is what this answers.
 */
export interface RetentionCohort {
  d1_eligible: number;  d1_returned: number;
  d7_eligible: number;  d7_returned: number;
  d30_eligible: number; d30_returned: number;
}

export interface RetentionDay {
  date: string;
  /** Field name is the RPC's. Not renamed; accessed as d['new']. */
  'new': number;
  returning: number;
}

export interface Retention {
  cohort: RetentionCohort;
  daily: RetentionDay[];
  window_days: number;
  computed_at: string;
}

export function useRetention(days = 56) {
  return useQuery<Retention>({
    queryKey: ['admin-v2', 'retention', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_retention' as any, { p_days: days });
      if (error) throw error;
      return data as unknown as Retention;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
