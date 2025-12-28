import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

export interface MutualFriend {
  id: string;
  avatar_url: string | null;
  display_name: string;
}

interface MutualFriendsAvatarsProps {
  friends: MutualFriend[];
  maxDisplay?: number;
}

/**
 * Displays overlapping mini-avatars for mutual friends.
 * Uses SquircleAvatar matching the SDS design system (1/1.05 aspect, 34% radius).
 */
export const MutualFriendsAvatars: React.FC<MutualFriendsAvatarsProps> = ({ 
  friends, 
  maxDisplay = 3 
}) => {
  const displayFriends = friends.slice(0, maxDisplay);

  if (displayFriends.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5">
      {displayFriends.map((friend, index) => (
        <div
          key={friend.id}
          className="relative"
          style={{ zIndex: maxDisplay - index }}
        >
          <SquircleAvatar
            src={friend.avatar_url}
            alt={friend.display_name}
            size={20}
            thinRing
          />
        </div>
      ))}
    </div>
  );
};

export default MutualFriendsAvatars;
