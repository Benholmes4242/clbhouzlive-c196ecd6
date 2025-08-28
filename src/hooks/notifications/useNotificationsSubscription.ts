import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { channelManager } from '@/utils/supabaseChannelManager';

export const useNotificationsSubscription = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up notifications subscription for user:', userId);
    const channelName = `notifications-${userId}`;
    
    const setupSubscription = async () => {
      try {
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
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to notifications');
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('Notifications realtime subscription failed - continuing without realtime updates');
            }
          });
      } catch (error) {
        console.warn('Failed to setup notifications realtime subscription:', error);
        // App continues to work without realtime notifications
      }
    };

    setupSubscription();

    return () => {
      console.log('Cleaning up notifications subscription');
      channelManager.removeChannel(channelName);
    };
  }, [userId, queryClient]);
};