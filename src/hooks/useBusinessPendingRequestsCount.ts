import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

/**
 * Hook to get the count of pending access requests for a business.
 * Used to show indicator dot on "Manage team" button.
 */
export function useBusinessPendingRequestsCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-pending-requests-count', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return 0;

      const { count, error } = await supabase
        .from('business_access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending');

      if (error) {
        AppLog.error('[useBusinessPendingRequestsCount]', 'error:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: 'always', // Force refetch when component mounts (ensures dot clears after decline on other page)
    refetchOnWindowFocus: true,
  });
}
