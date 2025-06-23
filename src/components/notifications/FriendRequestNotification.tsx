
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserCheck, X } from 'lucide-react';

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

  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={requester_photo} alt={requester_name} />
          <AvatarFallback>
            {requester_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{requester_name}</p>
          <p className="text-sm text-muted-foreground">
            {requester_username ? `@${requester_username}` : 'wants to be friends'}
          </p>
        </div>
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
  );
};

export default FriendRequestNotification;
