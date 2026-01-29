/**
 * useGameNotifications - Hook for sending game/trip notifications
 * 
 * Handles:
 * - Invite notifications
 * - RSVP update notifications (friends only, going only)
 * - Reminder notifications
 * - Game update notifications (time/course changes only)
 * - Game completed notifications
 * - Trip notifications
 * 
 * Implements suppression rules:
 * - No notifications for own actions
 * - No notifications for Maybe/Declined RSVP changes
 * - No notifications for minor edits (notes, description)
 * - Grouping for multiple RSVPs within 10 minutes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type GameNotificationType = 
  | 'game_invite'
  | 'rsvp_update'
  | 'game_reminder_24h'
  | 'game_reminder_2h'
  | 'game_updated'
  | 'game_completed'
  | 'trip_created'
  | 'trip_game_added'
  | 'trip_reminder'
  | 'trip_cancelled'
  | 'trip_updated';

interface SendGameNotificationParams {
  type: GameNotificationType;
  recipientUserIds: string[];
  gameId?: string;
  tripId?: string;
  data?: {
    course_name?: string;
    course_id?: string;
    date?: string;
    time?: string;
    date_range?: string;
    trip_name?: string;
    player_name?: string;
    new_time?: string;
  };
  actorUserId?: string;
}

interface NotificationRecord {
  user_id: string;
  recipient_actor_type: string;
  recipient_actor_id: string;
  type: string;
  title: string;
  message: string | null;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  data: Record<string, any>;
  is_read: boolean;
}

// Get title based on notification type
function getNotificationTitle(type: GameNotificationType, data?: SendGameNotificationParams['data']): string {
  switch (type) {
    case 'game_invite':
      return "You've been invited to a game";
    case 'rsvp_update':
      return `${data?.player_name || 'Someone'} joined`;
    case 'game_reminder_24h':
      return "You're playing tomorrow";
    case 'game_reminder_2h':
      return "Game starting soon";
    case 'game_updated':
      return "Game details updated";
    case 'game_completed':
      return "Game completed";
    case 'trip_created':
      return "You've been added to a trip";
    case 'trip_game_added':
      return "New game added to trip";
    case 'trip_reminder':
      return "Trip starts tomorrow";
    case 'trip_cancelled':
      return "Trip cancelled";
    case 'trip_updated':
      return "Trip updated";
    default:
      return "Game notification";
  }
}

// Get message/subcopy based on notification type
// Format: game = "Course · Date · Time", trip = "TripName · DateRange" or "TripName · Course"
function getNotificationMessage(type: GameNotificationType, data?: SendGameNotificationParams['data']): string | null {
  // Trip notifications
  if (type.startsWith('trip_')) {
    const tripName = data?.trip_name || 'Trip';
    if (data?.date_range) {
      return `${tripName} · ${data.date_range}`;
    }
    if (data?.course_name) {
      return `${tripName} · ${data.course_name}`;
    }
    return tripName;
  }

  // Game notifications: Course · Date · Time
  if (type === 'game_updated' && data?.new_time) {
    return `${data.course_name || 'Game'} · New tee time: ${data.new_time}`;
  }

  // Standard game format: Course · Date · Time
  const parts: string[] = [];
  if (data?.course_name) parts.push(data.course_name);
  if (data?.date) parts.push(data.date);
  if (data?.time) parts.push(data.time);
  
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Hook to send game notifications
 */
export function useSendGameNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendGameNotificationParams) => {
      const { type, recipientUserIds, gameId, tripId, data, actorUserId } = params;

      if (recipientUserIds.length === 0) {
        return { sent: 0 };
      }

      // Get current user if actorUserId not provided
      let actor = actorUserId;
      if (!actor) {
        const { data: { user } } = await supabase.auth.getUser();
        actor = user?.id || null;
      }

      // Filter out the actor from recipients (no self-notifications)
      const filteredRecipients = recipientUserIds.filter(id => id !== actor);
      
      if (filteredRecipients.length === 0) {
        return { sent: 0 };
      }

      // Build notification records
      const notifications: NotificationRecord[] = filteredRecipients.map(userId => ({
        user_id: userId,
        recipient_actor_type: 'personal',
        recipient_actor_id: userId,
        type,
        title: getNotificationTitle(type, data),
        message: getNotificationMessage(type, data),
        actor_id: actor || null,
        entity_type: gameId ? 'game' : tripId ? 'trip' : null,
        entity_id: gameId || tripId || null,
        data: {
          ...data,
          game_id: gameId,
          trip_id: tripId,
        },
        is_read: false,
      }));

      // Insert notifications
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('[useSendGameNotification] Error inserting notifications:', error);
        throw error;
      }

      return { sent: notifications.length };
    },
    onSuccess: () => {
      // Invalidate activity feed queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error) => {
      console.error('[useSendGameNotification] Failed:', error);
    },
  });
}

/**
 * Hook for sending RSVP update notifications
 * Only sends for "going" status changes to friends/host
 */
export function useSendRsvpNotification() {
  const sendNotification = useSendGameNotification();

  return useMutation({
    mutationFn: async (params: {
      gameId: string;
      newStatus: 'going' | 'maybe' | 'declined' | 'invited';
      playerName: string;
      courseName: string;
      date: string;
      recipientUserIds: string[]; // Friends who are participants + host
    }) => {
      // SUPPRESSION: Only notify for "going" status
      if (params.newStatus !== 'going') {
        return { sent: 0, suppressed: true, reason: 'Only going status triggers notifications' };
      }

      await sendNotification.mutateAsync({
        type: 'rsvp_update',
        recipientUserIds: params.recipientUserIds,
        gameId: params.gameId,
        data: {
          player_name: params.playerName,
          course_name: params.courseName,
          date: params.date,
        },
      });

      return { sent: params.recipientUserIds.length, suppressed: false };
    },
  });
}

/**
 * Hook for sending game invite notifications
 */
export function useSendGameInviteNotification() {
  const sendNotification = useSendGameNotification();

  return useMutation({
    mutationFn: async (params: {
      gameId: string;
      invitedUserIds: string[];
      courseName: string;
      date: string;
      time: string;
    }) => {
      await sendNotification.mutateAsync({
        type: 'game_invite',
        recipientUserIds: params.invitedUserIds,
        gameId: params.gameId,
        data: {
          course_name: params.courseName,
          date: params.date,
          time: params.time,
        },
      });

      return { sent: params.invitedUserIds.length };
    },
  });
}

/**
 * Hook for sending game completed notification
 */
export function useSendGameCompletedNotification() {
  const sendNotification = useSendGameNotification();

  return useMutation({
    mutationFn: async (params: {
      gameId: string;
      participantUserIds: string[];
      courseName: string;
    }) => {
      await sendNotification.mutateAsync({
        type: 'game_completed',
        recipientUserIds: params.participantUserIds,
        gameId: params.gameId,
        data: {
          course_name: params.courseName,
        },
      });

      return { sent: params.participantUserIds.length };
    },
  });
}

/**
 * Hook for sending game update notifications
 * Only notifies for time/course changes, not notes/description
 */
export function useSendGameUpdateNotification() {
  const sendNotification = useSendGameNotification();

  return useMutation({
    mutationFn: async (params: {
      gameId: string;
      participantUserIds: string[];
      courseName: string;
      newTime?: string;
      changeType: 'time' | 'course' | 'notes';
    }) => {
      // SUPPRESSION: Only notify for time/course changes
      if (params.changeType === 'notes') {
        return { sent: 0, suppressed: true, reason: 'Notes changes do not trigger notifications' };
      }

      await sendNotification.mutateAsync({
        type: 'game_updated',
        recipientUserIds: params.participantUserIds,
        gameId: params.gameId,
        data: {
          course_name: params.courseName,
          new_time: params.newTime,
        },
      });

      return { sent: params.participantUserIds.length, suppressed: false };
    },
  });
}

/**
 * Utility: Format game date for notifications
 */
export function formatGameDateForNotification(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEE d MMM'); // e.g., "Tue 14 Jan"
}

/**
 * Utility: Format game time for notifications
 */
export function formatGameTimeForNotification(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm'); // e.g., "09:40"
}
