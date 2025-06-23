
export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'follow' | 'other';
  title: string;
  message: string | null;
  data: Record<string, any> | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markNonPersistentAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  removeFriendRequestNotifications: (friendRequestId: string) => Promise<void>;
  refetch: () => Promise<void>;
}
