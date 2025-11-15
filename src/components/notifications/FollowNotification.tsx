import React from 'react';
import { Button } from '@/components/ui/button';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FollowNotificationProps {
  notification: any;
}

const FollowNotification: React.FC<FollowNotificationProps> = ({
  notification
}) => {
  const navigate = useNavigate();
  
  const data = notification.data || {};
  const followerName = data.follower_name || 'Someone';
  const followerPhoto = data.follower_photo;
  const followerUsername = data.follower_username;

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

  const handleViewProfile = () => {
    if (followerUsername) {
      navigate(`/profile/${followerUsername}`);
    }
  };

  return (
    <div className="p-4 border-b border-border bg-background">
      <div className="flex items-start gap-3">
        <AvatarSquircle 
          size="md"
          src={followerPhoto}
          alt={followerName}
          fallback={followerName?.charAt(0)?.toUpperCase() || '?'}
        />
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h4 className="font-semibold text-sm text-blue-600 mb-1">New Follower</h4>
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {followerUsername ? `@${followerUsername}` : followerName}
              </span>{' '}
              started following you
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(notification.created_at)}
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={handleViewProfile} 
            className="flex items-center gap-1"
          >
            <UserPlus className="h-4 w-4" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FollowNotification;