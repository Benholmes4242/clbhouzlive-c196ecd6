
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
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  isFollowing,
  friendStatus
}) => {
  const { loading, handleFollow, handleFriendRequest, handleRemoveFriend } = useProfileActions({
    targetUserId,
    currentUserId
  });

  return (
    <div className="flex items-center justify-center gap-3 mt-6 mb-6">
      <FollowButton
        isFollowing={isFollowing}
        loading={loading}
        onFollow={() => handleFollow(isFollowing)}
      />

      <MessageButton friendStatus={friendStatus} />

      <FriendButton
        friendStatus={friendStatus}
        loading={loading}
        onFriendRequest={() => handleFriendRequest(friendStatus)}
      />

      <ActionsDropdown
        friendStatus={friendStatus}
        loading={loading}
        onRemoveFriend={handleRemoveFriend}
      />
    </div>
  );
};

export default UserProfileActions;
