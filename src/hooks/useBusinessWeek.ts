/**
 * CB67 — reader for the deployed `public.get_business_week(p_business_id)`.
 * The RPC owns every figure (last 7 days to the hour vs the 7 before). A
 * failed call throws so the card shows its error state, never zeros.
 * bars: index 0 is the oldest 24h, index 6 the most recent 24h.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessWeek {
  window_start: string;
  window_end: string;
  visits: number;
  visits_prev: number;
  seen_by: number;
  seen_by_prev: number;
  new_followers: number;
  followers_total: number;
  taps: { website: number; directions: number; call: number; message: number };
  bars: { visits: number[]; seen_by: number[]; new_followers: number[] };
  created_at: string;
  first_week: boolean;
  last_post_at: string | null;
}

export const businessWeekKey = (businessId: string | undefined) => ['business-week', businessId] as const;

export function useBusinessWeek(businessId: string | undefined) {
  return useQuery({
    queryKey: businessWeekKey(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BusinessWeek> => {
      const { data, error } = await supabase.rpc('get_business_week', { p_business_id: businessId as string });
      if (error) throw error;
      if (!data || typeof data !== 'object') throw new Error('get_business_week returned no data');
      return data as unknown as BusinessWeek;
    },
  });
}
