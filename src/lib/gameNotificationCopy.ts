/**
 * Game & Trip Notification Copy
 * Centralized copy for all game/trip notification types
 */

export const GAME_NOTIFICATION_COPY = {
  // A. Game Invites
  game_invite: {
    title: "You've been invited to a game",
    getSubcopy: (courseName: string, date: string, time: string) => 
      `${courseName} · ${date} · ${time}`,
  },

  // B. RSVP Updates (friends only, going only)
  rsvp_update: {
    getTitle: (playerName: string) => `${playerName} is going`,
    getSubcopy: (courseName: string, date: string) => 
      `${courseName} · ${date}`,
  },

  // C. Reminder Notifications
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

  // D. Game Updated (time/course change)
  game_updated: {
    title: "Game details updated",
    getSubcopy: (courseName: string, newTime?: string) => 
      newTime 
        ? `${courseName} · New tee time: ${newTime}`
        : courseName,
  },

  // E. Game Ended
  game_completed: {
    title: "Game completed",
    getSubcopy: (courseName: string) => `${courseName} · View recap`,
  },

  // F. Trip Notifications
  trip_created: {
    title: "You've been added to a trip",
    getSubcopy: (tripName: string, dateRange: string) => 
      `${tripName} · ${dateRange}`,
  },
  trip_game_added: {
    title: "New game added to trip",
    getSubcopy: (tripName: string, courseName: string) => 
      `${tripName} · ${courseName}`,
  },
  trip_reminder: {
    title: "Trip starts tomorrow",
    getSubcopy: (tripName: string) => tripName,
  },
} as const;

// Types for notification payloads
export interface GameNotificationPayload {
  type: 'game_invite' | 'rsvp_update' | 'game_reminder_24h' | 'game_reminder_2h' | 
        'game_updated' | 'game_completed' | 'trip_created' | 'trip_game_added' | 'trip_reminder';
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
  };
}

// Game notification types for type checking
export const GAME_NOTIFICATION_TYPES = new Set([
  'game_invite',
  'rsvp_update',
  'game_reminder_24h',
  'game_reminder_2h',
  'game_updated',
  'game_completed',
  'trip_created',
  'trip_game_added',
  'trip_reminder',
]);

// Check if a notification type is game-related
export function isGameNotification(type: string): boolean {
  return GAME_NOTIFICATION_TYPES.has(type);
}

// Check if a notification type is trip-related
export function isTripNotification(type: string): boolean {
  return type.startsWith('trip_');
}
