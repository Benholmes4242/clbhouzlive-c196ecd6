/**
 * Game & Trip Notification Copy
 * Centralized copy for all game/trip notification types
 */

import { RSVP_LABELS } from './rsvpLabels';

export const GAME_NOTIFICATION_COPY = {
  // A. Game Join Request (Host receives)
  game_request: {
    title: "New join request",
    getSubcopy: (requesterName: string, courseName: string) =>
      `${requesterName} wants to join your game at ${courseName}`,
  },

  // B. Game Request Accepted (Requester receives)
  game_request_accepted: {
    title: "You're in! 🎉",
    getSubcopy: (courseName: string) =>
      `Your request to join ${courseName} was accepted`,
  },

  // C. Game Request Declined (Requester receives)
  game_request_declined: {
    title: "Request declined",
    getSubcopy: (courseName: string) =>
      `Your request to join ${courseName} was declined`,
  },

  // D. Game Invites
  game_invite: {
    title: "You've been invited to a game",
    getSubcopy: (courseName: string, date: string, time: string) => 
      `${courseName} · ${date} · ${time}`,
  },

  // E. Game Cancelled
  game_cancelled: {
    title: "Game cancelled",
    getSubcopy: (courseName: string) =>
      `The game at ${courseName} has been cancelled`,
  },

  // F. RSVP Updates (friends only, joined only)
  rsvp_update: {
    getTitle: (playerName: string) => `${playerName} ${RSVP_LABELS.going.toLowerCase()}`,
    getSubcopy: (courseName: string, date: string) => 
      `${courseName} · ${date}`,
  },

  // G. Reminder Notifications
  game_reminder_24h: {
    title: "You're playing tomorrow",
    getSubcopy: (courseName: string, time: string) => 
      `${courseName} · ${time}`,
  },
  game_reminder_2h: {
    title: "Game starting soon",
    getSubcopy: (courseName: string, time: string) => 
      `${courseName} · ${time}`,
  },

  // H. Game Updated (time/course change)
  game_updated: {
    title: "Game details updated",
    getSubcopy: (courseName: string, newTime?: string) => 
      newTime 
        ? `${courseName} · New tee time: ${newTime}`
        : courseName,
  },

  // I. Game Ended
  game_completed: {
    title: "Game completed",
    getSubcopy: (courseName: string) => `${courseName} · View recap`,
  },

  // J. Trip Join Request (Organizer receives)
  trip_request: {
    title: "New trip request",
    getSubcopy: (requesterName: string, tripName: string) =>
      `${requesterName} wants to join ${tripName}`,
  },

  // K. Trip Request Accepted (Requester receives)
  trip_request_accepted: {
    title: "You're on the trip! 🎉",
    getSubcopy: (tripName: string) =>
      `Your request to join ${tripName} was accepted`,
  },

  // L. Trip Request Declined (Requester receives)
  trip_request_declined: {
    title: "Trip request declined",
    getSubcopy: (tripName: string) =>
      `Your request to join ${tripName} was declined`,
  },

  // M. Trip Invite
  trip_invite: {
    title: "Trip invitation ✈️",
    getSubcopy: (organizerName: string, tripName: string) =>
      `${organizerName} invited you to ${tripName}`,
  },

  // N. Trip Created
  trip_created: {
    title: "You've been added to a trip",
    getSubcopy: (tripName: string, dateRange: string) => 
      `${tripName} · ${dateRange}`,
  },

  // O. Trip Game Added
  trip_game_added: {
    title: "New game added to trip",
    getSubcopy: (tripName: string, courseName: string) => 
      `${tripName} · ${courseName}`,
  },

  // P. Trip Reminder
  trip_reminder: {
    title: "Trip starts tomorrow",
    getSubcopy: (tripName: string) => tripName,
  },

  // Q. Trip Cancelled
  trip_cancelled: {
    title: "Trip cancelled",
    getSubcopy: (tripName: string) => `${tripName} has been cancelled`,
  },

  // R. Trip Updated
  trip_updated: {
    title: "Trip updated",
    getSubcopy: (tripName: string) => tripName,
  },
} as const;

// Types for notification payloads
export interface GameNotificationPayload {
  type: 'game_request' | 'game_request_accepted' | 'game_request_declined' |
        'game_invite' | 'game_cancelled' | 'rsvp_update' | 
        'game_reminder_24h' | 'game_reminder_2h' | 'game_updated' | 'game_completed' | 
        'trip_request' | 'trip_request_accepted' | 'trip_request_declined' |
        'trip_invite' | 'trip_created' | 'trip_game_added' | 'trip_reminder' | 
        'trip_cancelled' | 'trip_updated';
  actor_user_id?: string;
  target_user_id: string;
  game_id?: string;
  trip_id?: string;
  data?: {
    course_name?: string;
    course_id?: string;
    date?: string;
    time?: string;
    date_range?: string;
    trip_name?: string;
    player_name?: string;
    new_time?: string;
    reminder_type?: '24h' | '2h';
    requester_name?: string;
    organizer_name?: string;
    request_message?: string;
  };
}

// Game notification types for type checking
export const GAME_NOTIFICATION_TYPES = new Set([
  'game_request',
  'game_request_accepted',
  'game_request_declined',
  'game_invite',
  'game_cancelled',
  'rsvp_update',
  'game_reminder_24h',
  'game_reminder_2h',
  'game_updated',
  'game_completed',
  'trip_request',
  'trip_request_accepted',
  'trip_request_declined',
  'trip_invite',
  'trip_created',
  'trip_game_added',
  'trip_reminder',
  'trip_cancelled',
  'trip_updated',
]);

// Check if a notification type is game-related
export function isGameNotification(type: string): boolean {
  return GAME_NOTIFICATION_TYPES.has(type);
}

// Check if a notification type is trip-related
export function isTripNotification(type: string): boolean {
  return type.startsWith('trip_');
}
