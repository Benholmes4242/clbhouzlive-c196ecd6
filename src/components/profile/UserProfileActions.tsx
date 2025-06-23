
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
  const { loading, handleFollow, handleFriendRequest, handleRemoveFriend } = useProfileActions({
    targetUserId,
    currentUserId
  });

  // Only allow friend requests between individual users (both must be individual)
  const canSendFriendRequest = targetUserType === 'individual' && currentUserType === 'individual';
  
  // Allow messaging between friends or if either is a business/club
  const canMessage = friendStatus === 'accepted' || targetUserType !== 'individual' || currentUserType !== 'individual';

  console.log('UserProfileActions - targetUserType:', targetUserType, 'currentUserType:', currentUserType);
  console.log('UserProfileActions - canSendFriendRequest:', canSendFriendRequest);

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

        {/* Only show friend button if both users are individuals */}
        {canSendFriendRequest && (
          <FriendButton
            friendStatus={friendStatus}
            loading={loading}
            onFriendRequest={() => handleFriendRequest(friendStatus)}
          />
        )}
      </div>

      {/* Secondary action buttons */}
      <div className="flex items-center justify-center gap-3">
        {canMessage && (
          <MessageButton friendStatus={friendStatus} />
        )}
        
        {/* Only show actions dropdown if both users are individuals */}
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
