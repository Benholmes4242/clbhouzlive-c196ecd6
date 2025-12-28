import React from 'react';
import { Squircle } from '@/components/ui/squircle';

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
 * Uses Squircle shape matching the SDS design system.
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
          <Squircle width={20} height={21} className="ring-1 ring-background">
            <img
              src={friend.avatar_url || '/placeholder.svg'}
              alt={friend.display_name}
              className="w-full h-full object-cover bg-muted"
              loading="lazy"
            />
          </Squircle>
        </div>
      ))}
    </div>
  );
};

export default MutualFriendsAvatars;
