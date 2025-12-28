import React from 'react';

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
 * Shows up to 3 avatars with white borders for visual separation.
 */
export const MutualFriendsAvatars: React.FC<MutualFriendsAvatarsProps> = ({ 
  friends, 
  maxDisplay = 3 
}) => {
  const displayFriends = friends.slice(0, maxDisplay);

  if (displayFriends.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {displayFriends.map((friend, index) => (
        <div
          key={friend.id}
          className="relative"
          style={{ zIndex: maxDisplay - index }}
        >
          <img
            src={friend.avatar_url || '/placeholder.svg'}
            alt={friend.display_name}
            className="w-5 h-5 rounded-full border-2 border-background object-cover bg-muted"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default MutualFriendsAvatars;
