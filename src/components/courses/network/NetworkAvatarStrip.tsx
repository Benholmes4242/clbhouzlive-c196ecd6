import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { NetworkFriend } from '@/hooks/useNetworkActivity';

interface NetworkAvatarStripProps {
  friends: NetworkFriend[];
  maxVisible?: number;
  className?: string;
}

/**
 * Horizontal avatar strip for network friends.
 * 
 * Key specs:
 * - 47px diameter avatars (30% larger than 36px)
 * - 8px gap between avatars
 * - NO colored rings or borders (clean look)
 * - Shows first 8 friends WHO HAVE ACTIVITY in last 30 days
 * - Only shows if there are active friends
 */
export const NetworkAvatarStrip: React.FC<NetworkAvatarStripProps> = ({
  friends,
  maxVisible = 8,
  className,
}) => {
  const navigate = useNavigate();

  // Filter to only friends who have activity (last_activity set)
  const activeFriends = friends.filter(f => f.last_activity !== null);

  // Don't render if no active friends
  if (activeFriends.length === 0) return null;

  const visibleFriends = activeFriends.slice(0, maxVisible);
  const remainingCount = activeFriends.length - maxVisible;

  const handleAvatarClick = (friendId: string) => {
    navigate(`/profile/${friendId}`);
  };

  const getInitials = (friend: NetworkFriend) => {
    const name = friend.display_name || friend.username || '';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  };

  return (
    <div className={cn('mt-2 mb-1.5', className)}>
      <div 
        className="flex gap-2"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
        }}
      >
        {visibleFriends.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleAvatarClick(friend.id)}
            className="flex-shrink-0 transition-transform duration-100 ease-out active:scale-95 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-border rounded-[34%]"
            aria-label={`View ${friend.display_name || friend.username}'s profile`}
          >
            <SquircleAvatar
              size={47}
              src={friend.profile_photo_url}
              alt={friend.display_name || friend.username}
              fallback={getInitials(friend)}
              hideRing
            />
          </button>
        ))}
        
        {/* Overflow indicator */}
        {remainingCount > 0 && (
          <div 
            className="flex-shrink-0 flex items-center justify-center bg-muted text-muted-foreground font-medium text-sm"
            style={{
              width: '47px',
              aspectRatio: '1 / 1.05',
              borderRadius: '34%',
            }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkAvatarStrip;
