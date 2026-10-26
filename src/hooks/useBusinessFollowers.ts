/**
 * Insights section 5 "Followers" (CB86).
 *
 * Reads `get_business_followers` (hand-applied INSIGHTS_FOLLOWERS_V1, not yet
 * in generated types). The server owns every count — team excluded, merge-day
 * follows never new — so the client never re-counts. Previous-period data
 * stays on screen while a new period loads.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessFollowers {
  period_days: number;
  total: number;
  followers: number;
  new: number;
  prev: number;
  last_new_at: string | null;
  reached: number;
  has_posts: boolean;
  merge_in_period: boolean;
}

const num = (v: unknown) => Number(v) || 0;

export function parseFollowers(raw: any, days: number): BusinessFollowers {
  const p = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  return {
    period_days: num(p.period_days) || days,
    total: num(p.total),
    followers: num(p.followers),
    new: num(p.new),
    prev: num(p.prev),
    last_new_at: p.last_new_at ? String(p.last_new_at) : null,
    reached: num(p.reached),
    has_posts: p.has_posts === true,
    merge_in_period: p.merge_in_period === true,
  };
}

export function useBusinessFollowers(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-followers', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BusinessFollowers> => {
      const { data, error } = await (supabase.rpc as any)('get_business_followers', {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;
      return parseFollowers(data, days);
    },
  });
}
