
export type NotificationType =
  | 'follow'
  | 'friend_request'
  | 'friend_accepted'
  | 'like'
  | 'comment'
  | 'mention'
  | 'message'
  | 'tag'
  | 'share'
  | 'golf_news'
  | 'course_activity'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  read: boolean;
  is_read: boolean;
  created_at: string;
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationIds: string[]) => void;
  handleFriendRequest: (friendRequestId: string, action: 'accept' | 'decline') => void;
  markAllNonFriendRequestsAsRead: () => void;
}
