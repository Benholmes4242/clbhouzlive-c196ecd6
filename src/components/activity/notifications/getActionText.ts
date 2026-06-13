import type { ActivityNotification } from '@/hooks/useActivityFeed';

/** Action-text copy keyed to the new two-tier system. */
export function getNotificationActionText(n: ActivityNotification): string {
  const { type, message, title } = n;
  switch (type) {
    case 'like':
    case 'like_post':
      return 'liked your post';
    case 'comment':
    case 'comment_post':
      return message
        ? `commented: "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`
        : 'commented on your post';
    case 'comment_reply':
      return 'replied to your comment';
    case 'mention':
    case 'mention_post':
    case 'comment_mention':
    case 'top_ten_mention':
      return 'mentioned you';
    case 'tag':
      return 'tagged you';
    case 'follow':
      return 'started following you';
    case 'new_post':
      return 'shared a new post';
    case 'friend_request':
      return 'wants to connect';
    case 'friend_accept':
    case 'friend_accepted':
      return "You're now connected";
    case 'friend_request_sent':
      return 'Friend request sent';
    case 'friend_course_review':
    case 'course_review':
      return 'reviewed this course';
    case 'business_course_review':
      return 'left a review';
    case 'review_response':
      return 'responded to your review';
    default:
      return title || message || 'New notification';
  }
}
