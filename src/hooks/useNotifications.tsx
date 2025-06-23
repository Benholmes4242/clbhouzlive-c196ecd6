
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'follow' | 'other';
  title: string;
  message: string | null;
  data: any;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useSupabaseSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      
      // Calculate unread count for persistent notifications only
      const persistentUnread = typedNotifications.filter(n => 
        !n.read && (n.type === 'friend_request' || n.type === 'message')
      ).length;
      setUnreadCount(persistentUnread);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      // Update local state
      setNotifications(currentNotifications => {
        return currentNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
      });
      
      // Update unread count separately to avoid circular dependencies
      setUnreadCount(currentCount => Math.max(0, currentCount - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(currentNotifications => 
        currentNotifications.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  };

  const markNonPersistentAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .not('type', 'in', '("friend_request","message")');

    if (!error) {
      setNotifications(currentNotifications => {
        const updated = currentNotifications.map(n => 
          n.type !== 'friend_request' && n.type !== 'message' 
            ? { ...n, read: true } 
            : n
        );
        
        // Recalculate unread count based on updated notifications
        const persistentUnread = updated.filter(n => 
          !n.read && (n.type === 'friend_request' || n.type === 'message')
        ).length;
        setUnreadCount(persistentUnread);
        
        return updated;
      });
    }
  };

  const removeNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update state by removing the notification
      setNotifications(currentNotifications => {
        const filtered = currentNotifications.filter(n => n.id !== notificationId);
        
        // Calculate new unread count from the filtered notifications
        const persistentUnread = filtered.filter(n => 
          !n.read && (n.type === 'friend_request' || n.type === 'message')
        ).length;
        setUnreadCount(persistentUnread);
        
        return filtered;
      });
    } catch (error) {
      console.error('Error removing notification:', error);
      throw error;
    }
  };

  const removeFriendRequestNotifications = async (friendRequestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('type', 'friend_request')
        .eq('data->friend_request_id', friendRequestId);

      if (!error) {
        setNotifications(currentNotifications => {
          const filtered = currentNotifications.filter(n => 
            !(n.type === 'friend_request' && n.data?.friend_request_id === friendRequestId)
          );
          
          // Recalculate unread count from filtered notifications
          const persistentUnread = filtered.filter(n => 
            !n.read && (n.type === 'friend_request' || n.type === 'message')
          ).length;
          setUnreadCount(persistentUnread);
          
          return filtered;
        });
      }
    } catch (error) {
      console.error('Error removing friend request notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markNonPersistentAsRead,
    removeNotification,
    removeFriendRequestNotifications,
    refetch: fetchNotifications
  };
}
