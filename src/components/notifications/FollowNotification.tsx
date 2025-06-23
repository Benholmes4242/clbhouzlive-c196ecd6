
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FollowNotificationProps {
  notification: any;
}

const FollowNotification: React.FC<FollowNotificationProps> = ({ notification }) => {
  const { follower_name, follower_photo, follower_username } = notification.data;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={follower_photo} alt={follower_name} />
          <AvatarFallback>
            {follower_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">You have a new follower!</h4>
          <p className="text-sm">
            <span className="font-medium">@{follower_username || follower_name}</span> is now following you.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FollowNotification;
