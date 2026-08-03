/**
 * Top 100 threshold distribution (Part A2).
 *
 * For each list, how many members have played N or more courses on it.
 * Population data: no caller-supplied user id.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Top100DistributionRow {
  list_slug: string;
  threshold: number;
  members_at_or_above: number;
  denominator: number;
}

/** The published Top 100 badge thresholds. */
export const TOP100_THRESHOLDS = [1, 3, 5, 10, 25, 50, 75, 100];

type RpcFn = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export function useTop100Distribution(enabled = true) {
  return useQuery({
    queryKey: ['gam', 'top100-distribution', TOP100_THRESHOLDS.join(',')],
    enabled,
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<Top100DistributionRow[]> => {
      const rpc = supabase.rpc as unknown as RpcFn;
      const { data, error } = await rpc('gam_top100_threshold_distribution', {
        p_thresholds: TOP100_THRESHOLDS,
      });
      if (error) throw new Error(error.message);
      return ((data ?? []) as Top100DistributionRow[]).map((r) => ({
        list_slug: r.list_slug,
        threshold: Number(r.threshold) || 0,
        members_at_or_above: Number(r.members_at_or_above) || 0,
        denominator: Number(r.denominator) || 0,
      }));
    },
  });
}

export default useTop100Distribution;
