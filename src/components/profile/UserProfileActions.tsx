
import React from 'react';
import FollowButton from './actions/FollowButton';
import MessageButton from './actions/MessageButton';
import FriendButton from './actions/FriendButton';
import ActionsDropdown from './actions/ActionsDropdown';
import { useProfileActions } from './actions/useProfileActions';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  // Only allow friend requests between individual users (both must be individual)
  const canSendFriendRequest = targetUserType === 'individual' && currentUserType === 'individual';
  
  // Allow messaging between friends or if either is a business/club
  const canMessage = friendStatus === 'accepted' || targetUserType !== 'individual' || currentUserType !== 'individual';

  const handleFollowersClick = () => {
    navigate(`/profile/${username}/followers`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Friend Button */}
      {canSendFriendRequest && (
        <FriendButton
          friendStatus={friendStatus}
          loading={loading}
          onFriendRequest={() => handleFriendRequest(friendStatus)}
        />
      )}

      {/* Follow Button */}
      <FollowButton
        isFollowing={isFollowing}
        loading={loading}
        onFollow={() => handleFollow(isFollowing)}
        friendStatus={friendStatus}
      />

      {/* Followers Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleFollowersClick}
        className="px-3 py-1 text-xs"
      >
        <Users className="w-3 h-3 mr-1" />
        Followers
      </Button>

      {/* Message Button */}
      {canMessage && (
        <MessageButton friendStatus={friendStatus} />
      )}

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
  );
};

export default UserProfileActions;
