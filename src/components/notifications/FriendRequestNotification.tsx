
import React from 'react';
import { Button } from '@/components/ui/button';
import { Squircle } from '@/components/ui/squircle';
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
  // Extract data from notification with fallbacks
  const data = notification.data || {};
  const requesterName = data.requester_name || 'Someone';
  const requesterPhoto = data.requester_photo;
  const requesterUsername = data.requester_username;

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
    <div className="p-4 border-b border-border bg-background">
      <div className="flex items-start gap-3">
        <Squircle width={56} height={56}>
          {requesterPhoto ? (
            <img src={requesterPhoto} alt={requesterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '22px', fontWeight: 600 }}>
              {requesterName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </Squircle>
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h4 className="font-semibold text-sm text-blue-600 mb-1">Friend Request</h4>
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {requesterUsername ? `@${requesterUsername}` : requesterName}
              </span>{' '}
              sent you a friend request
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(notification.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={onAccept} 
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="h-4 w-4" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDecline} 
              className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
            >
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
