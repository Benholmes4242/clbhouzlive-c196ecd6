
import React from 'react';
import FollowButton from './actions/FollowButton';
import MessageButton from './actions/MessageButton';
import FriendButton from './actions/FriendButton';
import ActionsDropdown from './actions/ActionsDropdown';
import { useProfileActions } from './actions/useProfileActions';

interface UserProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing: boolean;
  friendStatus: 'pending' | 'accepted' | null;
  username: string;
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  isFollowing,
  friendStatus,
  username
}) => {
  const { loading, handleFollow, handleFriendRequest, handleRemoveFriend } = useProfileActions({
    targetUserId,
    currentUserId
  });

  return (
    <div className="space-y-4">
      {/* Primary action buttons */}
      <div className="flex items-center justify-center gap-3">
        <FollowButton
          isFollowing={isFollowing}
          loading={loading}
          onFollow={() => handleFollow(isFollowing)}
          friendStatus={friendStatus}
        />

        <FriendButton
          friendStatus={friendStatus}
          loading={loading}
          onFriendRequest={() => handleFriendRequest(friendStatus)}
        />
      </div>

      {/* Secondary action buttons */}
      <div className="flex items-center justify-center gap-3">
        <MessageButton friendStatus={friendStatus} />
        
        <ActionsDropdown
          friendStatus={friendStatus}
          loading={loading}
          onRemoveFriend={handleRemoveFriend}
          username={username}
        />
      </div>
    </div>
  );
};

export default UserProfileActions;
