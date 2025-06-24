
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

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    console.log('Setting up notifications subscription for user:', user.id);

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
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
          filter: `user_id=eq.${user.id}`
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
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up notifications subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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
      console.log('Processing friend request:', { friendRequestId, action });
      
      if (action === 'accept') {
        // Update friend request status to accepted
        const { error: friendError } = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('id', friendRequestId);

        if (friendError) {
          console.error('Error accepting friend request:', friendError);
          throw friendError;
        }

        // Get the friend request details to create mutual follows
        const { data: friendRequest } = await supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .eq('id', friendRequestId)
          .single();

        if (friendRequest) {
          // Create mutual follow relationships
          const followPromises = [
            // User follows friend
            supabase
              .from('user_follows')
              .insert({
                follower_id: friendRequest.user_id,
                following_id: friendRequest.friend_id
              }),
            // Friend follows user  
            supabase
              .from('user_follows')
              .insert({
                follower_id: friendRequest.friend_id,
                following_id: friendRequest.user_id
              })
          ];

          await Promise.allSettled(followPromises);

          // Get the friend's username for the toast
          const { data: friendProfile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('id', friendRequest.user_id)
            .single();

          const friendName = friendProfile?.username ? `@${friendProfile.username}` : 
                           friendProfile?.display_name || 'User';

          // Show enhanced toast message
          toast({
            title: `🎉 You're now friends with ${friendName}`,
            description: "You're automatically following each other!",
            duration: 3000,
          });
        }
      } else {
        console.log('Declining friend request:', friendRequestId);
        const { error } = await supabase
          .from('user_friends')
          .delete()
          .eq('id', friendRequestId);

        if (error) {
          console.error('Error declining friend request:', error);
          throw error;
        }

        toast({
          title: "Friend request declined",
          duration: 1500,
        });
      }

      // Remove the notification
      const notification = notifications.find(n => n.data?.friend_request_id === friendRequestId);
      if (notification) {
        console.log('Removing notification:', notification.id);
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notification.id);

        if (error) {
          console.error('Error removing notification:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Also invalidate relationship status queries
      queryClient.invalidateQueries({ queryKey: ['relationshipStatus'] });
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      queryClient.invalidateQueries({ queryKey: ['followingCount'] });
      queryClient.invalidateQueries({ queryKey: ['friendsCount'] });
    },
    onError: (error) => {
      console.error('Friend request mutation error:', error);
      toast({
        title: "Error processing friend request",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
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
