
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, UserMinus } from 'lucide-react';

interface FriendButtonProps {
  friendStatus: 'pending' | 'accepted' | null;
  loading: boolean;
  onFriendRequest: () => void;
}

const FriendButton: React.FC<FriendButtonProps> = ({
  friendStatus,
  loading,
  onFriendRequest
}) => {
  const getButtonText = () => {
    if (loading) return "Loading...";
    if (friendStatus === 'accepted') return "Friends";
    if (friendStatus === 'pending') return "Request Sent";
    return "Add Friend";
  };

  const getButtonIcon = () => {
    if (friendStatus === 'accepted') return <UserCheck className="w-4 h-4" />;
    if (friendStatus === 'pending') return <UserMinus className="w-4 h-4" />;
    return <UserPlus className="w-4 h-4" />;
  };

  return (
    <Button
      variant={friendStatus === 'accepted' ? "secondary" : "outline"}
      onClick={onFriendRequest}
      disabled={loading || friendStatus === 'accepted'}
      className="flex-1 max-w-32"
    >
      {getButtonIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );
};

export default FriendButton;
