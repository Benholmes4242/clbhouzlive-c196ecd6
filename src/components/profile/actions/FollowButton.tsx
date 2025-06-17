
import React from 'react';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  isFollowing: boolean;
  loading: boolean;
  onFollow: () => void;
  friendStatus?: 'pending' | 'accepted' | null;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  loading,
  onFollow,
  friendStatus
}) => {
  const getButtonText = () => {
    if (loading) return "Loading...";
    
    // If users are friends, they should automatically be following each other
    if (friendStatus === 'accepted') {
      return "Following";
    }
    
    return isFollowing ? "Following" : "Follow";
  };

  const getButtonVariant = () => {
    // If users are friends or following, show secondary variant
    if (friendStatus === 'accepted' || isFollowing) {
      return "secondary";
    }
    return "default";
  };

  const shouldDisableButton = () => {
    // Disable if loading or if users are friends (they auto-follow)
    return loading || friendStatus === 'accepted';
  };

  return (
    <Button
      variant={getButtonVariant()}
      onClick={onFollow}
      disabled={shouldDisableButton()}
      className="flex-1 max-w-32"
    >
      {getButtonText()}
    </Button>
  );
};

export default FollowButton;
