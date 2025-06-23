
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
      // Cast the data to match our Notification interface
      const typedNotifications = data as Notification[];
      setNotifications(typedNotifications);
      
      // Calculate unread count - only count friend requests and messages as persistent notifications
      const persistentUnreadCount = typedNotifications.filter(n => 
        !n.read && (n.type === 'friend_request' || n.type === 'message')
      ).length;
      setUnreadCount(persistentUnreadCount);
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
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update unread count using current state
      setNotifications(currentNotifications => {
        const notification = currentNotifications.find(n => n.id === notificationId);
        if (notification && (notification.type === 'friend_request' || notification.type === 'message')) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return currentNotifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
      });
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
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const markNonPersistentAsRead = async () => {
    if (!user) return;

    // Mark all non-friend-request and non-message notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .not('type', 'in', '("friend_request","message")');

    if (!error) {
      setNotifications(prev => 
        prev.map(n => 
          n.type !== 'friend_request' && n.type !== 'message' 
            ? { ...n, read: true } 
            : n
        )
      );
      
      // Recalculate unread count using the updated notifications
      setNotifications(currentNotifications => {
        const persistentUnreadCount = currentNotifications.filter(n => 
          !n.read && (n.type === 'friend_request' || n.type === 'message')
        ).length;
        setUnreadCount(persistentUnreadCount);
        return currentNotifications.map(n => 
          n.type !== 'friend_request' && n.type !== 'message' 
            ? { ...n, read: true } 
            : n
        );
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

      // Remove from local state and update unread count
      setNotifications(prev => {
        const removedNotification = prev.find(n => n.id === notificationId);
        const newNotifications = prev.filter(n => n.id !== notificationId);
        
        if (removedNotification && !removedNotification.read && 
            (removedNotification.type === 'friend_request' || removedNotification.type === 'message')) {
          setUnreadCount(current => Math.max(0, current - 1));
        }
        
        return newNotifications;
      });
    } catch (error) {
      console.error('Error removing notification:', error);
      throw error;
    }
  };

  // Remove friend request notifications when they are accepted/declined
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
        // Update local state and recalculate unread count
        setNotifications(prev => {
          const updatedNotifications = prev.filter(n => 
            !(n.type === 'friend_request' && n.data?.friend_request_id === friendRequestId)
          );
          
          const persistentUnreadCount = updatedNotifications.filter(n => 
            !n.read && (n.type === 'friend_request' || n.type === 'message')
          ).length;
          setUnreadCount(persistentUnreadCount);
          
          return updatedNotifications;
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
