
import React from 'react';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  isFollowing: boolean;
  loading: boolean;
  onFollow: () => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  loading,
  onFollow
}) => {
  const getButtonText = () => {
    if (loading) return "Loading...";
    return isFollowing ? "Following" : "Follow";
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      onClick={onFollow}
      disabled={loading}
      className="flex-1 max-w-32"
    >
      {getButtonText()}
    </Button>
  );
};

export default FollowButton;
