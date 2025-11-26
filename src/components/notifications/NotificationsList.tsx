import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, UserPlus, Tag, MessageSquare, Heart, MessageCircle, Share, MapPin, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FollowNotification from './FollowNotification';
import TagNotification from './TagNotification';

interface NotificationsListProps {
  notifications: any[];
  onNotificationClick?: (notification: any) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications,
  onNotificationClick
}) => {
  const navigate = useNavigate();
  
  const handleClick = (notification: any, callback?: () => void) => {
    onNotificationClick?.(notification);
    callback?.();
  };

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

  const handlePostNotificationClick = (notification: any) => {
    const postId = notification.data?.post_id;
    if (postId) {
      // Navigate to post detail view when implemented
      console.log('Navigate to post:', postId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'share': return <Share className="h-5 w-5 text-green-500" />;
      case 'course_activity': return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'golf_news': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {notifications.map((notification) => {
          // Removed excessive logging for performance
          
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

          if (notification.type === 'message') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handleClick(notification, () => handleMessageNotificationClick(notification))}
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

          // Handle like notifications
          if (notification.type === 'like') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handlePostNotificationClick(notification)}
              >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon('like')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          // Handle comment notifications
          if (notification.type === 'comment') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handlePostNotificationClick(notification)}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon('comment')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          // Handle share notifications
          if (notification.type === 'share') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handlePostNotificationClick(notification)}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon('share')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          // Handle course activity notifications
          if (notification.type === 'course_activity') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => handlePostNotificationClick(notification)}
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon('course_activity')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          // Handle golf news notifications
          if (notification.type === 'golf_news') {
            return (
              <div 
                key={notification.id} 
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon('golf_news')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          // Skip deprecated friend request and friend accepted notifications
          if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
            return null;
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