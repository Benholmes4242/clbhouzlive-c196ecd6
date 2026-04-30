import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Clock, UserCheck, X } from 'lucide-react';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendship } from '@/hooks/useFriendship';

interface FollowFriendButtonsProps {
  targetUserId: string;
  compact?: boolean;
}

/**
 * Combined Follow + Friend action buttons for user profiles and cards
 */
export const FollowFriendButtons: React.FC<FollowFriendButtonsProps> = ({
  targetUserId,
  compact = false,
}) => {
  const { user } = useSupabaseSession();
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: targetUserId,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });
  const following = cached ?? false;
  const followBusy = toggle.isPending;

  const {
    status: friendStatus,
    isLoading: friendLoading,
    isUpdating: friendUpdating,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
  } = useFriendship(targetUserId);

  const isLoading = friendLoading;
  const isUpdating = followBusy || friendUpdating;

  const handleToggleFollow = () => {
    if (!user?.id || !targetUserId) return;
    toggle.mutate({
      targetActorType: 'personal',
      targetActorId: targetUserId,
      targetUserId: targetUserId,
      viewerActorType: 'personal',
      viewerActorId: user.id,
      viewerUserId: user.id,
      isFollowing: following,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size={compact ? "sm" : "default"} disabled className="opacity-50">
          Loading...
        </Button>
      </div>
    );
  }

  const renderFriendButton = () => {
    switch (friendStatus) {
      case 'friends':
        return (
          <Button
            variant="secondary"
            size={compact ? "sm" : "default"}
            disabled
            className="flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            Friends
          </Button>
        );

      case 'request_sent':
        return (
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => cancelRequest()}
            disabled={isUpdating}
            className="flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            {friendUpdating ? 'Cancelling...' : 'Request Sent'}
          </Button>
        );

      case 'request_received':
        return (
          <div className="flex gap-2">
            <Button
              variant="gradient"
              size={compact ? "sm" : "default"}
              onClick={() => acceptRequest()}
              disabled={isUpdating}
              className="flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {friendUpdating ? 'Accepting...' : 'Confirm'}
            </Button>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={() => declineRequest()}
              disabled={isUpdating}
              className="flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Decline
            </Button>
          </div>
        );

      case 'blocked':
        return null; // Don't show anything if blocked

      case 'none':
      default:
        return (
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => sendRequest()}
            disabled={isUpdating}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            {friendUpdating ? 'Sending...' : 'Add Friend'}
          </Button>
        );
    }
  };

  // Don't show Follow button if blocked
  if (friendStatus === 'blocked') {
    return null;
  }

  const following = isFollowing === 'following';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Follow Button */}
      <Button
        variant={following ? "secondary" : "gradient"}
        size={compact ? "sm" : "default"}
        onClick={toggleFollow}
        disabled={isUpdating}
        className="flex items-center gap-1.5"
      >
        {following ? (
          <>
            <Check className="w-4 h-4" />
            Following
          </>
        ) : (
          'Follow'
        )}
      </Button>

      {/* Friend Button(s) */}
      {renderFriendButton()}
    </div>
  );
};

export default FollowFriendButtons;
