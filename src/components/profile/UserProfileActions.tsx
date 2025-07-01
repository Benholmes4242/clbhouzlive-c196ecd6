
import React from 'react';
import FollowButton from './actions/FollowButton';
import MessageButton from './actions/MessageButton';
import FriendButton from './actions/FriendButton';
import ActionsDropdown from './actions/ActionsDropdown';
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
  friendStatus: 'pending' | 'accepted' | null;
  username: string;
  targetUserType?: string;
  currentUserType?: string;
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  isFollowing,
  friendStatus,
  username,
  targetUserType = 'individual',
  currentUserType = 'individual'
}) => {
  const navigate = useNavigate();
  const { loading, handleFollow, handleFriendRequest, handleRemoveFriend } = useProfileActions({
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

  // Only allow friend requests between individual users (both must be individual)
  const canSendFriendRequest = targetUserType === 'individual' && currentUserType === 'individual';
  
  // Allow messaging between friends or if either is a business/club
  const canMessage = friendStatus === 'accepted' || targetUserType !== 'individual' || currentUserType !== 'individual';

  const handleFollowersClick = () => {
    navigate(`/profile/${username}/followers`);
  };

  const handleMessageClick = () => {
    // Navigate to messages - placeholder for now
    console.log('Navigate to messages');
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
        {/* Friend Button */}
        {canSendFriendRequest && (
          <Button
            variant={friendStatus === 'accepted' ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFriendRequest(friendStatus)}
            disabled={loading || friendStatus === 'accepted'}
            className="px-2 py-1 text-xs h-7 flex-shrink-0"
          >
            {friendStatus === 'accepted' ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Friends ✓
              </>
            ) : (
              <>
                Request Friend
              </>
            )}
          </Button>
        )}

        {/* Follow Button */}
        <Button
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          onClick={() => handleFollow(isFollowing)}
          disabled={loading}
          className="px-2 py-1 text-xs h-7 flex-shrink-0"
        >
          {isFollowing ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Following ✓
            </>
          ) : (
            'Follow'
          )}
        </Button>

        {/* Followed Button (shows if target user follows current user) */}
        <Button 
          variant="outline" 
          size="sm"
          disabled
          className="px-2 py-1 text-xs h-7 flex-shrink-0"
        >
          {targetUserFollowsMe ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Followed ✓
            </>
          ) : (
            'Followed'
          )}
        </Button>

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

        {/* Actions Dropdown */}
        {canSendFriendRequest && (
          <ActionsDropdown
            friendStatus={friendStatus}
            loading={loading}
            onRemoveFriend={handleRemoveFriend}
            username={username}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfileActions;
