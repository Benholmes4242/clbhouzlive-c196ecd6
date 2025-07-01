
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
    return isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />;
  };

  const getButtonVariant = () => {
    return isFollowing ? "secondary" : "default";
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      onClick={onFollow}
      disabled={loading}
      className="px-3 py-1 text-xs"
    >
      {getButtonIcon()}
      <span className="ml-1">{getButtonText()}</span>
    </Button>
  );
};

export default FollowButton;
