
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';

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

  const getButtonIcon = () => {
    return isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />;
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
      {getButtonIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );
};

export default FollowButton;
