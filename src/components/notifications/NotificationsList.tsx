import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import FollowNotification from './FollowNotification';
import TagNotification from './TagNotification';
import FriendAcceptedNotification from './FriendAcceptedNotification';
import LikeNotification from './LikeNotification';
import CommentNotification from './CommentNotification';
import MentionNotification from './MentionNotification';
import MessageNotification from './MessageNotification';

interface NotificationsListProps {
  notifications: any[];
  onNotificationClick?: (notification: any) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications,
  onNotificationClick
}) => {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardContent className="p-0">
        {notifications.map((notification) => {
          // Follow notification
          if (notification.type === 'follow') {
            return (
              <FollowNotification
                key={notification.id}
                notification={notification}
              />
            );
          }
          
          // Tag notification
          if (notification.type === 'tag') {
            return (
              <TagNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          // Friend accepted notification
          if (notification.type === 'friend_accepted') {
            return (
              <FriendAcceptedNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          // Like notification
          if (notification.type === 'like') {
            return (
              <LikeNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          // Comment notification
          if (notification.type === 'comment') {
            return (
              <CommentNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          // Mention notification
          if (notification.type === 'mention') {
            return (
              <MentionNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          // Message notification
          if (notification.type === 'message') {
            return (
              <MessageNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          // Skip friend_request type in general list (handled in Friend Requests section)
          if (notification.type === 'friend_request') {
            return null;
          }

          // Fallback for other notification types (golf_news, course_activity, share, system)
          return (
            <div key={notification.id} className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title || 'Notification'}</p>
                <p className="text-sm text-muted-foreground">{notification.message || 'You have a new notification'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(notification.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default NotificationsList;
