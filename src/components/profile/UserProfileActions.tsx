import React from 'react';
import { useProfileActions } from './actions/useProfileActions';
import { Button } from '@/components/ui/button';
import { Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing: boolean;
  username: string;
  targetUserType?: string;
  currentUserType?: string;
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  isFollowing,
  username,
  targetUserType = 'individual',
  currentUserType = 'individual'
}) => {
  const navigate = useNavigate();
  const { loading, handleFollow } = useProfileActions({
    targetUserId,
    currentUserId
  });

  // Check if target user follows the current user
  const { data: targetUserFollowsMe = false } = useQuery({
    queryKey: ['userFollowsMe', targetUserId, currentUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!targetUserId && !!currentUserId,
  });

  const handleFollowersClick = () => {
    navigate(`/profile/${username}/followers`);
  };

  const handleMessageClick = () => {
    // Navigate to messages with the target user
    navigate(`/messages?friend=${targetUserId}`);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div 
        className="flex items-center gap-2 min-w-max px-1 py-1"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Follow Button */}
        <Button
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          onClick={() => handleFollow(isFollowing)}
          disabled={loading}
          className="px-3 py-1 text-xs h-7 flex-shrink-0"
        >
          {isFollowing ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </Button>

        {/* Follows You Badge (shows if target user follows current user) */}
        {targetUserFollowsMe && (
          <div className="px-2 py-1 text-xs h-7 flex-shrink-0 bg-muted text-muted-foreground rounded-md flex items-center">
            Follows you
          </div>
        )}

        {/* Followers Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleFollowersClick}
          className="px-2 py-1 text-xs h-7 flex-shrink-0"
        >
          <Users className="w-3 h-3 mr-1" />
          Followers
        </Button>

        {/* Message Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleMessageClick}
          className="px-2 py-1 text-xs h-7 flex-shrink-0"
        >
          Message
        </Button>
      </div>
    </div>
  );
};

export default UserProfileActions;