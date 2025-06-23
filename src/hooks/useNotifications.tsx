
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'follow' | 'tag' | 'message';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleFriendRequestMutation = useMutation({
    mutationFn: async ({ friendRequestId, action }: { friendRequestId: string; action: 'accept' | 'decline' }) => {
      if (action === 'accept') {
        const { error } = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('id', friendRequestId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_friends')
          .delete()
          .eq('id', friendRequestId);

        if (error) throw error;
      }

      // Remove the notification
      const notification = notifications.find(n => n.data?.friend_request_id === friendRequestId);
      if (notification) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notification.id);

        if (error) throw error;
      }
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
        description: action === 'accept' ? 'You are now friends!' : 'Request removed',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationIds: string[]) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const handleFriendRequest = (friendRequestId: string, action: 'accept' | 'decline') => {
    handleFriendRequestMutation.mutate({ friendRequestId, action });
  };

  const markAllNonFriendRequestsAsRead = () => {
    const nonFriendRequestIds = notifications
      .filter(n => n.type !== 'friend_request' && !n.read)
      .map(n => n.id);
    
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
