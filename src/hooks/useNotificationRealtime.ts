/**
 * Real-time Notification Subscription Hook
 *
 * Subscribes to notifications table for real-time updates.
 * Shows toast notifications for important notifications.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { appNavigate } from '@/utils/navigation';

// Notification types that should show a toast
const IMPORTANT_NOTIFICATION_TYPES = new Set([
  // Social notifications
  'follow',
  'friend_request',
  'friend_accept',
  // Friend course review notifications
  'friend_course_review',
  // Admin invite
  'admin_invite',
]);

interface RealtimeNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  data: Record<string, any>;
  created_at: string;
}

export function useNotificationRealtime() {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as RealtimeNotification;

          // Invalidate notification queries to refresh the list
          queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
          queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
          
          // Show toast for important notifications
          if (IMPORTANT_NOTIFICATION_TYPES.has(notification.type)) {
            const toastAction = getToastAction(notification);
            
            toast(notification.title, {
              description: notification.message || undefined,
              action: toastAction,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

function getToastAction(notification: RealtimeNotification) {
  const { entity_type, entity_id, data, type } = notification;

  // Social notifications — navigate to the actor's profile
  if ((type === 'follow' || type === 'friend_request' || type === 'friend_accept') && data?.follower_id) {
    return {
      label: 'View',
      onClick: () => { appNavigate(`/profile/${data.follower_id}`); },
    };
  }

  if ((type === 'friend_request' || type === 'friend_accept') && data?.requester_id) {
    return {
      label: 'View',
      onClick: () => { appNavigate(`/profile/${data.requester_id}`); },
    };
  }

  // Navigate to activity page for social notifications without specific actor data
  if (type === 'follow' || type === 'friend_request' || type === 'friend_accept') {
    return {
      label: 'View',
      onClick: () => { appNavigate('/activity'); },
    };
  }

  if (entity_type === 'post' && entity_id) {
    return {
      label: 'View',
      onClick: () => { appNavigate(`/post/${entity_id}`); },
    };
  }

  if (type === 'friend_course_review' && data?.course_id) {
    return {
      label: 'View',
      onClick: () => { appNavigate(`/courses/${data.course_id}`); },
    };
  }

  if (data?.post_id) {
    return {
      label: 'View',
      onClick: () => { appNavigate(`/post/${data.post_id}`); },
    };
  }

  return undefined;
}
