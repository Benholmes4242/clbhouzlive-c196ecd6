
import { Notification } from './types';

export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => 
    !n.read && (n.type === 'friend_request' || n.type === 'message')
  ).length;
};

export const markNotificationAsRead = (notifications: Notification[], notificationId: string): Notification[] => {
  return notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
};

export const markAllNotificationsAsRead = (notifications: Notification[]): Notification[] => {
  return notifications.map(n => ({ ...n, read: true }));
};

export const markNonPersistentNotificationsAsRead = (notifications: Notification[]): Notification[] => {
  return notifications.map(n => 
    n.type !== 'friend_request' && n.type !== 'message' 
      ? { ...n, read: true } 
      : n
  );
};

export const removeNotificationById = (notifications: Notification[], notificationId: string): Notification[] => {
  return notifications.filter(n => n.id !== notificationId);
};

export const removeFriendRequestNotificationsById = (notifications: Notification[], friendRequestId: string): Notification[] => {
  return notifications.filter(n => 
    !(n.type === 'friend_request' && n.data?.friend_request_id === friendRequestId)
  );
};
