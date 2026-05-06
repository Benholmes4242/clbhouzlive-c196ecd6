import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HandicapPercentileResult } from './types';
import { whsKeys } from './hooks';

export function useHandicapPercentile(userId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.percentile(userId ?? ''),
    enabled: !!userId,
    // 12 hours — view refreshes nightly so cached values stay fresh enough
    staleTime: 12 * 60 * 60 * 1000,
    queryFn: async (): Promise<HandicapPercentileResult> => {
      const { data, error } = await supabase.rpc('get_my_handicap_percentile' as any);
      if (error) throw error;
      return data as unknown as HandicapPercentileResult;
    },
  });
}
