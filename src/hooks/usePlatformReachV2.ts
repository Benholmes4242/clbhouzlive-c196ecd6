/**
 * usePlatformReachV2 — get_platform_reach_v2() for the Your businesses welcome
 * (CB102). Rounds and reviews only; golfers is returned but deliberately unused.
 * One-hour staleTime/gcTime like usePlatformReach, which stays for AppDownloadGate.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformReachV2 {
  rounds: number;
  roundsDelta: number;
  reviews: number;
  reviewsDelta: number;
}

const ONE_HOUR = 3_600_000;

export function usePlatformReachV2() {
  return useQuery<PlatformReachV2>({
    queryKey: ['platform-reach-v2'],
    staleTime: ONE_HOUR,
    gcTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_platform_reach_v2');
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
      return {
        rounds: Number(row?.rounds ?? 0),
        roundsDelta: Number(row?.rounds_delta ?? 0),
        reviews: Number(row?.reviews ?? 0),
        reviewsDelta: Number(row?.reviews_delta ?? 0),
      };
    },
  });
}
