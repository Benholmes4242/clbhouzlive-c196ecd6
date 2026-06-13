import type { ActivityNotification } from '@/hooks/useActivityFeed';

/**
 * Tier router for the redesigned activity feed.
 *
 *  - line     → NotificationLineRow inside a NotificationLineGroup
 *  - review   → ReviewNotificationCard
 *  - request  → RequestNotificationCard (friend_request only)
 *  - trophy   → AchievementNotificationCard
 *  - status   → StatusRow (verification + access)
 *  - legacy   → existing FeaturedNotificationCard (game_*, trip_*, rsvp_*, anything else)
 *
 * Game/Trip types are intentionally NOT migrated — that subsystem is being
 * decommissioned in a separate pass.
 */
export type NotificationTier = 'line' | 'review' | 'request' | 'trophy' | 'status' | 'legacy';

const LINE_TYPES = new Set([
  'like', 'like_post',
  'follow',
  'mention', 'mention_post', 'comment_mention', 'top_ten_mention',
  'tag',
  'comment', 'comment_post', 'comment_reply',
  'top_ten_comment', 'top_ten_reply',
  'friend_accept', 'friend_accepted',
  'new_post',
  'review_response',
]);

const REVIEW_TYPES = new Set([
  'course_review', 'friend_course_review', 'business_course_review',
]);

const TROPHY_TYPES = new Set([
  'achievement', 'achievement_unlocked', 'milestone_reached',
]);

const GAME_TRIP_PREFIXES = ['game_', 'trip_', 'rsvp_'];

export function isGameOrTripType(type: string): boolean {
  return GAME_TRIP_PREFIXES.some((p) => type.startsWith(p));
}

export function getNotificationTier(n: ActivityNotification): NotificationTier {
  const t = n.type;
  if (isGameOrTripType(t)) return 'legacy';
  if (t === 'friend_request') return 'request';
  if (REVIEW_TYPES.has(t)) return 'review';
  if (TROPHY_TYPES.has(t)) return 'trophy';
  if (LINE_TYPES.has(t)) return 'line';
  if (
    t.startsWith('business_verification_') ||
    t.startsWith('golfer_verification_') ||
    t.startsWith('business_access_') ||
    t === 'business_member_added'
  ) {
    return 'status';
  }
  return 'legacy';
}
