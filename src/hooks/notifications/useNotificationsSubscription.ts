import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subscriptionManager } from '@/utils/subscriptionManager';

export const useNotificationsSubscription = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up notifications subscription for user:', userId);
    const channelName = `notifications-${userId}`;
    
    subscriptionManager.createSubscription(channelName, [
      {
        event: 'postgres_changes',
        options: {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback: (payload: any) => {
          console.log('New notification received:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      },
      {
        event: 'postgres_changes',
        options: {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback: (payload: any) => {
          console.log('Notification updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      },
      {
        event: 'postgres_changes',
        options: {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback: (payload: any) => {
          console.log('Notification deleted:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    ]);

    return () => {
      console.log('Cleaning up notifications subscription');
      subscriptionManager.removeSubscription(channelName);
    };
  }, [userId]);
};