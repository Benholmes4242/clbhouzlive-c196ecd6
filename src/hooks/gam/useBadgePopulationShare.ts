/**
 * Measured badge share (Part A1).
 *
 * Population data, not personal data: the RPC takes no user id and counts
 * distinct holders against the members who have a posted handicap index.
 * The CLIENT computes the percentage so the rounding rule lives in one place
 * (see career/shareModel.ts).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BadgeShareRow {
  badge_id: string;
  holders: number;
  denominator: number;
}

type RpcFn = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export function useBadgePopulationShare(enabled = true) {
  return useQuery({
    queryKey: ['gam', 'badge-population-share'],
    enabled,
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<Map<string, BadgeShareRow>> => {
      const rpc = supabase.rpc as unknown as RpcFn;
      const { data, error } = await rpc('gam_badge_population_share');
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as BadgeShareRow[];
      const map = new Map<string, BadgeShareRow>();
      for (const row of rows) {
        map.set(row.badge_id, {
          badge_id: row.badge_id,
          holders: Number(row.holders) || 0,
          denominator: Number(row.denominator) || 0,
        });
      }
      return map;
    },
  });
}

export default useBadgePopulationShare;
