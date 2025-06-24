
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle, UserPlus, Tag, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FriendRequestNotification from './FriendRequestNotification';
import FollowNotification from './FollowNotification';
import TagNotification from './TagNotification';

interface NotificationsListProps {
  notifications: any[];
  onAcceptFriendRequest: (friendRequestId: string) => void;
  onDeclineFriendRequest: (friendRequestId: string) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications, 
  onAcceptFriendRequest, 
  onDeclineFriendRequest 
}) => {
  const navigate = useNavigate();

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

  const handleMessageNotificationClick = (notification: any) => {
    const senderId = notification.data?.sender_id;
    if (senderId) {
      navigate('/messages');
    }
  };

  const handleFriendAcceptedClick = (notification: any) => {
    const friendUsername = notification.data?.accepter_username;
    if (friendUsername) {
      navigate(`/profile/${friendUsername}`);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {notifications.map((notification) => {
          console.log('Rendering notification:', notification); // Debug log

          if (notification.type === 'friend_request') {
            const friendRequestId = notification.data?.friend_request_id;
            if (!friendRequestId) {
              console.warn('Friend request notification missing friend_request_id:', notification);
              return null;
            }
            
            return (
              <FriendRequestNotification
                key={notification.id}
                notification={notification}
                onAccept={() => onAcceptFriendRequest(friendRequestId)}
                onDecline={() => onDeclineFriendRequest(friendRequestId)}
              />
            );
          }
          
          if (notification.type === 'follow') {
            return (
              <FollowNotification
                key={notification.id}
                notification={notification}
              />
            );
          }
          
          if (notification.type === 'tag') {
            return (
              <TagNotification
                key={notification.id}
                notification={notification}
              />
            );
          }

          if (notification.type === 'friend_accepted') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handleFriendAcceptedClick(notification)}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Tap to view profile</p>
                </div>
              </div>
            );
          }

          if (notification.type === 'message') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handleMessageNotificationClick(notification)}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Tap to open messages</p>
                </div>
              </div>
            );
          }

          // Fallback for unknown notification types
          console.warn('Unknown notification type:', notification.type, notification);
          return (
            <div key={notification.id} className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-gray-600" />
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
