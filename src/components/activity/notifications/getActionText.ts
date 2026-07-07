import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { stripMentionMarkup } from '@/lib/mentions/format';

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
        ? `commented: "${stripMentionMarkup(message).slice(0, 80)}${message.length > 80 ? '…' : ''}"`
        : 'commented on your post';
    case 'comment_reply':
      return 'replied to your comment';
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
    case 'course_review_received':
      return 'left a review on your course';
    case 'review_response_posted':
      return 'responded to your review';
    case 'mention': {
      // Copy driven by the source_type baked into the notification `data`.
      // The trigger already populates a full message string, so prefer it —
      // stripped of any raw markup that may have leaked in.
      const sourceType = (n as any).data?.source_type as string | undefined;
      const kind =
        sourceType === 'post' ? 'a post' :
        sourceType === 'comment' ? 'a comment' :
        sourceType === 'review' ? 'a review' :
        sourceType === 'top_ten_comment' ? 'a Top 10 comment' :
        'a post';
      const businessName = (n as any).data?.business_name as string | undefined;
      if (businessName) return `mentioned ${businessName} in ${kind}`;
      if (message) return stripMentionMarkup(message);
      return `mentioned you in ${kind}`;
    }
    default:
      return title || message || 'New notification';
  }
}

