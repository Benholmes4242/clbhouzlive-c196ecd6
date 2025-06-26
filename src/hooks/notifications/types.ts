
export interface Notification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'follow' | 'tag' | 'message';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationIds: string[]) => void;
  handleFriendRequest: (friendRequestId: string, action: 'accept' | 'decline') => void;
  markAllNonFriendRequestsAsRead: () => void;
}
