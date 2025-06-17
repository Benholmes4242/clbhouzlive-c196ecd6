
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
    return isFollowing ? "Following" : "Follow";
  };

  const getButtonVariant = () => {
    return isFollowing ? "secondary" : "default";
  };

  return (
    <Button
      variant={getButtonVariant()}
      onClick={onFollow}
      disabled={loading}
      className="flex-1 max-w-32"
    >
      {getButtonText()}
    </Button>
  );
};

export default FollowButton;
