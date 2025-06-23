
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Notification, NotificationHookReturn } from './types';
import { getUnreadCount } from './utils';
import { useNotificationActions } from './useNotificationActions';

export function useNotifications(): NotificationHookReturn {
  const { user } = useSupabaseSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const actions = useNotificationActions(notifications, setNotifications, setUnreadCount);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();
    
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    console.log('Fetching notifications for user:', user.id);
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      console.log('Fetched notifications:', data);
      const typedNotifications = data as Notification[];
      setNotifications(typedNotifications);
      setUnreadCount(getUnreadCount(typedNotifications));
    }
    setLoading(false);
  };

  return {
    notifications,
    unreadCount,
    loading,
    ...actions,
    refetch: fetchNotifications
  };
}
