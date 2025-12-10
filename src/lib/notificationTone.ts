// Notification tone categories for cinematic overlay tinting
export type NotificationTone =
  | 'friends'   // Friend requests, acceptances - green tint
  | 'follows'   // Follows, follow back - orange tint
  | 'engagement' // Likes, comments, mentions - blue tint
  | 'clubs'     // Club/course activity - teal tint
  | 'system';   // Default/system - neutral

export function getNotificationTone(type: string): NotificationTone {
  switch (type) {
    // Friends - green, matches Accept / Friends buttons
    case 'friend_request':
    case 'friend_request_sent':
    case 'friend_accepted':
    case 'friend_declined':
    case 'friend_cancelled':
      return 'friends';

    // Follows - orange, matches Follow back button
    case 'follow':
    case 'follow_back':
    case 'follow_started':
    case 'follow_request':
      return 'follows';

    // Engagement - likes/comments/mentions
    case 'like':
    case 'like_post':
    case 'post_like':
    case 'comment':
    case 'comment_post':
    case 'reply':
    case 'mention':
    case 'mention_post':
    case 'tag':
      return 'engagement';

    // Clubs / courses
    case 'club_post':
    case 'club_announcement':
    case 'club_invite':
    case 'club_follow':
    case 'club_event':
    case 'club_update':
    case 'course_review':
    case 'course_like':
    case 'course_follow':
    case 'course_update':
    case 'event':
      return 'clubs';

    // Default - system/achievements/other
    default:
      return 'system';
  }
}

// Tone-based gradient overlays for cinematic cards
export const TONE_GRADIENTS: Record<NotificationTone, string> = {
  friends: 'bg-gradient-to-t from-black/60 via-emerald-900/35 to-emerald-800/20',
  follows: 'bg-gradient-to-t from-black/60 via-amber-900/35 to-amber-800/20',
  engagement: 'bg-gradient-to-t from-black/60 via-blue-900/35 to-blue-800/20',
  clubs: 'bg-gradient-to-t from-black/60 via-teal-900/35 to-teal-800/20',
  system: 'bg-gradient-to-t from-black/70 via-black/40 to-black/20',
};
