import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TeamActivity } from '@/components/business/teamList';

/** CB76: TEAM_ACTIVITY_V1 read. Raises 42501 for non-members, so it waits for membership. */
export function useBusinessTeamActivity(businessId: string | undefined, isMember: boolean) {
  return useQuery({
    queryKey: ['business-team-activity', businessId],
    enabled: !!businessId && isMember,
    queryFn: async (): Promise<TeamActivity[]> => {
      const { data, error } = await (supabase.rpc as any)('get_business_team_activity', { p_business_id: businessId });
      if (error) throw error;
      return Array.isArray(data) ? (data as TeamActivity[]) : [];
    },
  });
}
