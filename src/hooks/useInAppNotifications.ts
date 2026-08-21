import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import {
  handleEngagementNotification,
  type NotificationRealtimeRow,
} from '@/lib/postEngagementRealtime';


interface NotificationData {
  conversation_id?: string;
  sender_name?: string;
  sender_avatar?: string;
}

export function useInAppNotifications() {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const location = useLocation();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      hasInteractedRef.current = true;
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Initialize audio for notification sound
  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    // This avoids needing an external audio file
    audioRef.current = null; // We'll use Web Audio API instead
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!hasInteractedRef.current) return;

    try {
      // Use Web Audio API for a simple notification beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      // Audio not supported or blocked
    }
  }, []);

  // Use ref for pathname to avoid recreating handleNotification on every route change
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // Check if user is currently viewing a specific conversation
  const isViewingConversation = useCallback((conversationId: string): boolean => {
    return pathnameRef.current === `/messages/${conversationId}`;
  }, []);

  // Handle incoming notification
  const handleNotification = useCallback((
    title: string,
    body: string | null,
    data: NotificationData | null
  ) => {
    // Don't show if viewing the same conversation
    if (data?.conversation_id && isViewingConversation(data.conversation_id)) {
      return;
    }

    // Don't show if document is hidden (background notifications will handle it)
    if (document.hidden) return;

    // Play sound
    playNotificationSound();

    // Show toast notification
    toast.message(title, {
      description: body || undefined,
      duration: 5000,
      action: data?.conversation_id ? {
        label: 'View',
        onClick: () => navigate(`/messages/${data.conversation_id}`),
      } : undefined,
    });
  }, [isViewingConversation, playNotificationSound, navigate]);

  // Subscribe to notification queue + invalidate per-actor unread on any new
  // notification routed to the user OR to a business they manage.
  const queryClient = useQueryClient();
  const { availableActors } = useActiveActor();
  const businessActorIds = availableActors
    .filter(a => a.type === 'business')
    .map(a => a.id);
  const businessKey = businessActorIds.join(',');

  useEffect(() => {
    if (!user) return;

    const invalidateUnread = () => {
      queryClient.invalidateQueries({ queryKey: ['actor-unread-counts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['activity-v2'], exact: false });
    };

    /**
     * THE CONTENT HALF OF THE SAME EVENT (BRIEF_REALTIME_COUNTS_AND_MENTION_TAP
     * §A1). `invalidateUnread` refreshes the BADGES; this refreshes the POST the
     * notification is about, on the channel that already exists — no per-post
     * subscription, so a feed of thirty cards still opens zero extra channels.
     *
     * CAVEAT (§A3): the counts are written straight into the caches, so they
     * move whether or not the feed query is mounted; the comment-list
     * invalidation inside `refreshPostEngagement` only acts on a MOUNTED query,
     * because `refetchOnMount: false` is app-wide and is not this brief's job.
     */
    const refreshNotifiedPost = (row: unknown) =>
      handleEngagementNotification(queryClient, (row ?? {}) as NotificationRealtimeRow);



    const channel = supabase
      .channel(`inapp_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'push_notification_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as {
            title: string;
            body: string | null;
            data: NotificationData | null;
          };

          handleNotification(
            notification.title,
            notification.body,
            notification.data,
          );
        },
      )
      // Personal-recipient notification inserts → refresh badges AND the post
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          invalidateUnread();
          refreshNotifiedPost(payload.new);
        },
      );

    // Business-recipient notification inserts (shared inbox) → same two halves
    if (businessActorIds.length > 0) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_actor_id=in.(${businessActorIds.join(',')})`,
        },
        (payload) => {
          invalidateUnread();
          refreshNotifiedPost(payload.new);
        },
      );
    }


    channel.subscribe();
    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, handleNotification, queryClient, businessKey]);

  return null;
}
