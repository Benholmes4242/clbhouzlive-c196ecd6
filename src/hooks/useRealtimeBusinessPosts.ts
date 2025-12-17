import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeBusinessPosts(businessId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`rt:business-posts:${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (row?.actor_type === 'business' && row?.actor_id === businessId) {
            qc.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
            qc.invalidateQueries({ queryKey: ['actor-posts-count', 'business', businessId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, qc]);
}
