
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNotificationMutations } from './notifications/useNotificationMutations';
import { useNotificationsSubscription } from './notifications/useNotificationsSubscription';
import { filterNonFriendRequestNotifications, calculateUnreadCount } from './notifications/utils';
import { Notification, UseNotificationsReturn } from './notifications/types';

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useSupabaseSession();
  const { markAsReadMutation, handleFriendRequestMutation } = useNotificationMutations();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log('Fetched notifications:', data);
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Set up real-time subscription
  useNotificationsSubscription(user?.id);

  const unreadCount = calculateUnreadCount(notifications);

  const markAsRead = (notificationIds: string[]) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const handleFriendRequest = (friendRequestId: string, action: 'accept' | 'decline') => {
    handleFriendRequestMutation.mutate({ friendRequestId, action });
  };

  const markAllNonFriendRequestsAsRead = () => {
    const nonFriendRequestIds = filterNonFriendRequestNotifications(notifications);
    
    if (nonFriendRequestIds.length > 0) {
      markAsRead(nonFriendRequestIds);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    handleFriendRequest,
    markAllNonFriendRequestsAsRead,
  };
};
