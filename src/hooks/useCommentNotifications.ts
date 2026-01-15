/**
 * useCommentNotifications - Hook for managing comment notifications
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { COMMENT_NOTIFICATION } from '@/lib/supabase/selects';

export interface CommentNotification {
  id: string;
  type: 'comment' | 'reply' | 'mention';
  post_id: string;
  comment_id: string;
  parent_comment_id: string | null;
  actor_user_id: string;
  recipient_user_id: string;
  read_at: string | null;
  created_at: string;
}

export function useCommentNotifications() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  // Fetch unread notifications count
  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ['comment-notifications-count', user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('comment_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error fetching notification count:', error);
        return 0;
      }

      return count || 0;
    },
  });

  // Fetch recent notifications
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['comment-notifications', user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('comment_notifications')
        .select('id, type, post_id, comment_id, parent_comment_id, actor_user_id, recipient_user_id, read_at, created_at')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data as CommentNotification[];
    },
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async ({
      type,
      postId,
      commentId,
      parentCommentId,
      recipientUserId,
    }: {
      type: 'comment' | 'reply' | 'mention';
      postId: string;
      commentId: string;
      parentCommentId?: string;
      recipientUserId: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Don't notify yourself
      if (recipientUserId === user.id) return;

      const { error } = await supabase
        .from('comment_notifications')
        .insert({
          type,
          post_id: postId,
          comment_id: commentId,
          parent_comment_id: parentCommentId || null,
          actor_user_id: user.id,
          recipient_user_id: recipientUserId,
        });

      if (error) throw error;
    },
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('comment_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comment-notifications-count', user?.id] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('comment_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comment-notifications-count', user?.id] });
    },
  });

  return {
    unreadCount,
    notifications,
    isLoading,
    isLoadingNotifications,
    createNotification: createNotificationMutation.mutate,
    markRead: (notificationId: string) => markReadMutation.mutate(notificationId),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
