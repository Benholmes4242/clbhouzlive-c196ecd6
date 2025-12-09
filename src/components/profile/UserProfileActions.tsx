import React, { useEffect } from 'react';
import { useProfileActions } from './actions/useProfileActions';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Clock, UserCheck, X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFollow } from '@/hooks/useFollow';
import { useFriendship } from '@/hooks/useFriendship';

interface UserProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing?: boolean; // Optional now, we'll use hook internally
  username: string;
  targetUserType?: string;
  currentUserType?: string;
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  username,
  targetUserType = 'individual',
  currentUserType = 'individual'
}) => {
  const navigate = useNavigate();
  
  // Use the new hooks
  const { isFollowing: followState, busy: followBusy, toggle: toggleFollow, ensureInitial } = useFollow(targetUserId);
  const { 
    status: friendStatus, 
    isLoading: friendLoading, 
    isUpdating: friendUpdating,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
  } = useFriendship(targetUserId);

  // Initialize follow state on mount
  useEffect(() => {
    ensureInitial();
  }, [ensureInitial]);

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

  const handleMessageClick = () => {
    navigate(`/messages?friend=${targetUserId}`);
  };

  const isLoading = followState === 'unknown' || friendLoading;
  const isUpdating = followBusy || friendUpdating;
  const following = followState === 'following';

  const renderFriendButton = () => {
    switch (friendStatus) {
      case 'friends':
        return (
          <Button
            variant="chip-active"
            size="chip"
            disabled
            className="flex-shrink-0"
          >
            <UserCheck className="w-3 h-3 mr-1" />
            Friends
          </Button>
        );

      case 'request_sent':
        return (
          <Button
            variant="outline"
            size="chip"
            onClick={() => cancelRequest()}
            disabled={isUpdating}
            className="flex-shrink-0"
          >
            <Clock className="w-3 h-3 mr-1" />
            {friendUpdating ? 'Cancelling...' : 'Pending'}
          </Button>
        );

      case 'request_received':
        return (
          <>
            <Button
              variant="gradient"
              size="chip"
              onClick={() => acceptRequest()}
              disabled={isUpdating}
              className="flex-shrink-0"
            >
              <Check className="w-3 h-3 mr-1" />
              {friendUpdating ? '...' : 'Confirm'}
            </Button>
            <Button
              variant="outline"
              size="chip"
              onClick={() => declineRequest()}
              disabled={isUpdating}
              className="flex-shrink-0"
            >
              <X className="w-3 h-3 mr-1" />
              Decline
            </Button>
          </>
        );

      case 'blocked':
        return null;

      case 'none':
      default:
        return (
          <Button
            variant="outline"
            size="chip"
            onClick={() => sendRequest()}
            disabled={isUpdating}
            className="flex-shrink-0"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            {friendUpdating ? '...' : 'Add Friend'}
          </Button>
        );
    }
  };

  // Don't show actions if blocked
  if (friendStatus === 'blocked') {
    return null;
  }

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
          variant={following ? "chip-active" : "gradient"}
          size="chip"
          onClick={toggleFollow}
          disabled={isLoading || isUpdating}
          className="flex-shrink-0"
        >
          {following ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </Button>

        {/* Friend Button(s) */}
        {renderFriendButton()}

        {/* Follows You Badge */}
        {targetUserFollowsMe && (
          <div className="px-2 py-1 text-xs h-7 flex-shrink-0 bg-muted text-muted-foreground rounded-sq-sm flex items-center">
            Follows you
          </div>
        )}

        {/* Message Button */}
        <Button 
          variant="outline" 
          size="chip"
          onClick={handleMessageClick}
          className="flex-shrink-0"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Message
        </Button>
      </div>
    </div>
  );
};

export default UserProfileActions;
