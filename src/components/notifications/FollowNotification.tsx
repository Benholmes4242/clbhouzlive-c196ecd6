
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';

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
    <div className="flex items-center gap-3 p-4 border-b border-border">
      <Avatar className="h-10 w-10">
        <AvatarImage src={follower_photo} alt={follower_name} />
        <AvatarFallback>
          {follower_name?.charAt(0)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">{follower_name}</p>
        <p className="text-sm text-muted-foreground">
          {follower_username ? `@${follower_username}` : ''} • {formatTimeAgo(notification.created_at)}
        </p>
      </div>
      <UserPlus className="h-5 w-5 text-green-600" />
    </div>
  );
};

export default FollowNotification;
