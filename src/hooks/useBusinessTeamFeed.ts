import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeedEvent } from '@/components/business/teamFeed';

export const businessTeamFeedKey = (businessId: string | undefined) => ['business-team-feed', businessId] as const;

/** CB78: get_business_team_feed. Owners/admins only (42501 otherwise), so it waits for that role. */
export function useBusinessTeamFeed(businessId: string | undefined, canManage: boolean) {
  return useQuery({
    queryKey: businessTeamFeedKey(businessId),
    enabled: !!businessId && canManage,
    queryFn: async (): Promise<FeedEvent[]> => {
      const { data, error } = await (supabase.rpc as any)('get_business_team_feed', { p_business_id: businessId });
      if (error) throw error;
      return Array.isArray(data) ? (data as FeedEvent[]) : [];
    },
  });
}
