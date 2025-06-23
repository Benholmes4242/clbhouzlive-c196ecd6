
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
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
  return (
    <Card>
      <CardContent className="p-0">
        {notifications.map((notification) => {
          if (notification.type === 'friend_request') {
            return (
              <FriendRequestNotification
                key={notification.id}
                notification={notification}
                onAccept={() => onAcceptFriendRequest(notification.data.friend_request_id)}
                onDecline={() => onDeclineFriendRequest(notification.data.friend_request_id)}
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
              <div key={notification.id} className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            );
          }

          return null;
        })}
      </CardContent>
    </Card>
  );
};

export default NotificationsList;
