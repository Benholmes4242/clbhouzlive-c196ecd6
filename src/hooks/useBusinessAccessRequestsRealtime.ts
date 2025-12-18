import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to realtime updates for business_access_requests.
 * Invalidates relevant queries when requests are created/updated/deleted.
 */
export function useBusinessAccessRequestsRealtime(businessId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;

    console.log('[useBusinessAccessRequestsRealtime] Subscribing for business:', businessId);

    const channel = supabase
      .channel(`business-access-requests-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'business_access_requests',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log('[useBusinessAccessRequestsRealtime] Received event:', payload.eventType, payload);
          
          // Invalidate all related queries
          queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count', businessId] });
          queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] });
        }
      )
      .subscribe((status) => {
        console.log('[useBusinessAccessRequestsRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useBusinessAccessRequestsRealtime] Unsubscribing for business:', businessId);
      supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);
}
