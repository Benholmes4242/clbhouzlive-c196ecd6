
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, X } from 'lucide-react';

interface FriendRequestNotificationProps {
  notification: any;
  onAccept: () => void;
  onDecline: () => void;
}

const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({
  notification,
  onAccept,
  onDecline
}) => {
  const { requester_name, requester_photo, requester_username } = notification.data;

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
          <AvatarImage src={requester_photo} alt={requester_name} />
          <AvatarFallback>
            {requester_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="mb-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Friend Request</h4>
            <p className="text-sm">
              <span className="font-medium">@{requester_username || requester_name}</span> has sent you a friend request.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(notification.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onAccept} className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={onDecline} className="flex items-center gap-1">
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestNotification;
