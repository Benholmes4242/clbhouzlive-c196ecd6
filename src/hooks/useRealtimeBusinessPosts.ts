import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to realtime updates for business posts
 * Invalidates cache when posts are created/updated/deleted for a business
 */
export function useRealtimeBusinessPosts(businessId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`rt:business-posts:${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          // Only invalidate if this event is for our business
          if (row?.actor_type === 'business' && row?.actor_id === businessId) {
            queryClient.invalidateQueries({ queryKey: ['business-posts', businessId] });
            queryClient.invalidateQueries({ queryKey: ['business-posts-count', businessId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);
}
