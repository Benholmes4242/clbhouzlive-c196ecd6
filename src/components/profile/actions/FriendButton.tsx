
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
    if (friendStatus === 'pending') return "Pending";
    return "Friend";
  };

  const getButtonIcon = () => {
    if (friendStatus === 'accepted') return <UserCheck className="w-3 h-3" />;
    if (friendStatus === 'pending') return <UserMinus className="w-3 h-3" />;
    return <UserPlus className="w-3 h-3" />;
  };

  return (
    <Button
      variant={friendStatus === 'accepted' ? "secondary" : "outline"}
      size="sm"
      onClick={onFriendRequest}
      disabled={loading || friendStatus === 'accepted'}
      className="px-2 py-1 text-xs h-7 flex-shrink-0"
    >
      {getButtonIcon()}
      <span className="ml-1">{getButtonText()}</span>
    </Button>
  );
};

export default FriendButton;
