import React from 'react';
import { Button } from '@/components/ui/button';
import { Squircle } from '@/components/ui/squircle';
import { UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FriendAcceptedNotificationProps {
  notification: any;
}

const FriendAcceptedNotification: React.FC<FriendAcceptedNotificationProps> = ({
  notification
}) => {
  const navigate = useNavigate();
  
  // Get actor_id from notification
  const actorId = notification.actor_id || notification.data?.accepter_id;
  
  // Fetch actor profile
  const { data: actorProfile } = useQuery({
    queryKey: ['user-profile', actorId],
    queryFn: async () => {
      if (!actorId) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', actorId)
        .single();
      return data;
    },
    enabled: !!actorId,
    staleTime: 5 * 60 * 1000,
  });

  const accepterName = actorProfile?.display_name || 'Someone';
  const accepterPhoto = actorProfile?.profile_photo_url;
  const accepterUsername = actorProfile?.username;

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
    if (actorId) {
      navigate(`/profile/${actorId}`);
    }
  };

  return (
    <div className="p-4 border-b border-border bg-background">
      <div className="flex items-start gap-3">
        <Squircle width={56} height={56}>
          {accepterPhoto ? (
            <img src={accepterPhoto} alt={accepterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '22px', fontWeight: 600 }}>
              {accepterName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </Squircle>
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h4 className="font-semibold text-sm text-green-600 mb-1">Friend Request Accepted</h4>
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {accepterUsername ? `@${accepterUsername}` : accepterName}
              </span>{' '}
              accepted your friend request
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
            <UserCheck className="h-4 w-4" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FriendAcceptedNotification;