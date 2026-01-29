/**
 * Real-time Notification Subscription Hook
 * 
 * Subscribes to notifications table for real-time updates.
 * Shows toast notifications for important game/trip notifications.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { appNavigate } from '@/utils/navigation';

// Notification types that should show a toast
const IMPORTANT_NOTIFICATION_TYPES = new Set([
  // Game notifications
  'game_request',
  'game_request_accepted',
  'game_request_declined',
  'game_invite',
  'game_cancelled',
  'game_updated',
  'game_reminder_24h',
  'game_reminder_2h',
  // Trip notifications
  'trip_request',
  'trip_request_accepted',
  'trip_request_declined',
  'trip_invite',
  'trip_cancelled',
  'trip_updated',
  // Friend course review notifications
  'friend_course_review',
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

    console.log('[useNotificationRealtime] Setting up subscription for user:', userId);

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
          console.log('[useNotificationRealtime] New notification received:', notification.type);

          // Invalidate notification queries to refresh the list
          queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          
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
      .subscribe((status) => {
        console.log('[useNotificationRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useNotificationRealtime] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

function getToastAction(notification: RealtimeNotification) {
  const { entity_type, entity_id, data, type } = notification;

  // Post-related: navigate to post deep link
  if (entity_type === 'post' && entity_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/post/${entity_id}`);
      },
    };
  }

  // Game-related: navigate to game detail
  if (entity_type === 'game' && entity_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/game/${entity_id}`);
      },
    };
  }

  // Trip-related: navigate to hub with trip param
  if (entity_type === 'trip' && entity_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/hub?trip=${entity_id}`);
      },
    };
  }

  // Course review: navigate to course page
  if (type === 'friend_course_review' && data?.course_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/courses/${data.course_id}`);
      },
    };
  }
  if (data?.game_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/game/${data.game_id}`);
      },
    };
  }

  if (data?.trip_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/hub?trip=${data.trip_id}`);
      },
    };
  }

  if (data?.post_id) {
    return {
      label: 'View',
      onClick: () => {
        appNavigate(`/post/${data.post_id}`);
      },
    };
  }

  return undefined;
}
