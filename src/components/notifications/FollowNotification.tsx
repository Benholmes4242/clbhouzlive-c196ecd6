import React from 'react';
import { Button } from '@/components/ui/button';
import { Squircle } from '@/components/ui/squircle';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFollow } from '@/hooks/useFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface FollowNotificationProps {
  notification: any;
}

const FollowNotification: React.FC<FollowNotificationProps> = ({
  notification
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  
  // Get actor_id from notification - could be in data or directly on notification
  const actorId = notification.actor_id || notification.data?.follower_id;
  
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

  // Follow back functionality
  const { isFollowing, toggle, ensureInitial } = useFollow(actorId);
  
  React.useEffect(() => {
    if (actorId) {
      ensureInitial();
    }
  }, [actorId, ensureInitial]);

  const followerName = actorProfile?.display_name || notification.data?.follower_name || 'Someone';
  const followerPhoto = actorProfile?.profile_photo_url || notification.data?.follower_photo;
  const followerUsername = actorProfile?.username || notification.data?.follower_username;

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
    } else if (followerUsername) {
      navigate(`/profile/${followerUsername}`);
    }
  };

  const isOwnProfile = user?.id === actorId;

  return (
    <div className="p-4 border-b border-border bg-background">
      <div className="flex items-start gap-3">
        <Squircle width={56} height={56}>
          {followerPhoto ? (
            <img src={followerPhoto} alt={followerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '22px', fontWeight: 600 }}>
              {followerName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </Squircle>
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
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleViewProfile} 
              variant="outline"
              className="flex items-center gap-1"
            >
              View Profile
            </Button>
            {!isOwnProfile && actorId && (
              <Button 
                size="sm" 
                onClick={toggle}
                variant={isFollowing === 'following' ? 'secondary' : 'default'}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                {isFollowing === 'following' ? 'Following' : 'Follow Back'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowNotification;