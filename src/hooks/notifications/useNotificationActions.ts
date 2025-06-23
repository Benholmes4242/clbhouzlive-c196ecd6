
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Notification } from './types';
import {
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markNonPersistentNotificationsAsRead,
  removeNotificationById,
  removeFriendRequestNotificationsById
} from './utils';

export const useNotificationActions = (
  notifications: Notification[],
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
) => {
  const { user } = useSupabaseSession();

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      const updated = markNotificationAsRead(notifications, notificationId);
      setNotifications(updated);
      setUnreadCount(getUnreadCount(updated));
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
      const updated = markAllNotificationsAsRead(notifications);
      setNotifications(updated);
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
      const updated = markNonPersistentNotificationsAsRead(notifications);
      setNotifications(updated);
      setUnreadCount(getUnreadCount(updated));
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

      const filtered = removeNotificationById(notifications, notificationId);
      setNotifications(filtered);
      setUnreadCount(getUnreadCount(filtered));
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
        const filtered = removeFriendRequestNotificationsById(notifications, friendRequestId);
        setNotifications(filtered);
        setUnreadCount(getUnreadCount(filtered));
      }
    } catch (error) {
      console.error('Error removing friend request notifications:', error);
    }
  };

  return {
    markAsRead,
    markAllAsRead,
    markNonPersistentAsRead,
    removeNotification,
    removeFriendRequestNotifications
  };
};
