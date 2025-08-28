import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationsSubscription = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up notifications subscription for user:', userId);
    const channelName = `notifications-${userId}`;
    
    import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
      const channel = channelManager.createChannel(channelName);
      
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Notification updated:', payload);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Notification deleted:', payload);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();
    });

    return () => {
      console.log('Cleaning up notifications subscription');
      import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
        channelManager.removeChannel(channelName);
      });
    };
  }, [userId]);
};