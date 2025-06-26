
import { Notification } from './types';

export const filterNonFriendRequestNotifications = (notifications: Notification[]) => {
  return notifications
    .filter(n => n.type !== 'friend_request' && !n.read)
    .map(n => n.id);
};

export const calculateUnreadCount = (notifications: Notification[]) => {
  return notifications.filter(n => !n.read).length;
};
