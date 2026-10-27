/**
 * CB103 — members of the business's club (CLUB_MEMBERS_V1). The server owns
 * the count; null when the business has no club. The hero shows the cell only
 * once this settles to 1 or more: no skeleton, no zero, nothing on error.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBusinessClubMemberCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-club-member-count', businessId],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase.rpc('get_business_club_member_count', { p_business_id: businessId! });
      if (error) throw error;
      return typeof data === 'number' ? data : null;
    },
  });
}
