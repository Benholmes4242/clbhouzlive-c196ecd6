import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * CB68 — pending team access requests for a business: the count and the
 * OLDEST created_at. Same table and status filter as
 * useBusinessPendingRequestsCount, but a failed read THROWS (that hook
 * swallows errors as 0), so Do next can drop its trigger instead of
 * silently hiding a real request.
 */
export interface PendingRequestsOldest {
  count: number;
  oldestAt: string | null;
}

export function useBusinessPendingRequestsOldest(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-pending-requests-oldest', businessId],
    enabled: !!businessId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<PendingRequestsOldest> => {
      const { data, count, error } = await supabase
        .from('business_access_requests')
        .select('created_at', { count: 'exact' })
        .eq('business_id', businessId as string)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      return { count: count ?? 0, oldestAt: (data?.[0] as { created_at?: string } | undefined)?.created_at ?? null };
    },
  });
}
