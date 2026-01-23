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
 * Horizontal scrollable avatar strip for network friends.
 * Shows active ring for friends active in last 7 days.
 * Only shows if user has >= 3 friends.
 */
export const NetworkAvatarStrip: React.FC<NetworkAvatarStripProps> = ({
  friends,
  maxVisible = 10,
  className,
}) => {
  const navigate = useNavigate();

  // Don't render if fewer than 3 friends
  if (friends.length < 3) return null;

  const visibleFriends = friends.slice(0, maxVisible);
  const remainingCount = friends.length - maxVisible;

  const handleAvatarClick = (friendId: string) => {
    navigate(`/profile/${friendId}`);
  };

  const getInitials = (friend: NetworkFriend) => {
    const name = friend.display_name || friend.username || '';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  };

  return (
    <div className={cn('mt-3', className)}>
      <div 
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleFriends.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleAvatarClick(friend.id)}
            className="flex-shrink-0 transition-transform duration-100 ease-out active:scale-95 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-[34%]"
            aria-label={`View ${friend.display_name || friend.username}'s profile`}
          >
            <div className="relative">
              <SquircleAvatar
                size={40}
                src={friend.profile_photo_url}
                alt={friend.display_name || friend.username}
                fallback={getInitials(friend)}
                hideRing
                className={cn(
                  friend.is_active_recently && 'ring-2 ring-primary/60'
                )}
              />
            </div>
          </button>
        ))}
        
        {/* Overflow indicator */}
        {remainingCount > 0 && (
          <div 
            className="flex-shrink-0 flex items-center justify-center bg-muted text-muted-foreground font-medium text-xs"
            style={{
              width: '40px',
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
