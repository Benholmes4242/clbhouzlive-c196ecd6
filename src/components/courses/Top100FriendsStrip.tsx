import React from 'react';
import { useNavigate } from 'react-router-dom';
import SquircleImage from '@/components/ui/SquircleImage';
import { useFriendsOnTop100Journey } from '@/hooks/useFriendsOnTop100Journey';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ChevronRight } from 'lucide-react';

export const Top100FriendsStrip: React.FC = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  
  const { data: friends = [] } = useFriendsOnTop100Journey(user?.id);

  // Only render if user is logged in and has friends on Top 100 journey
  if (!user || friends.length === 0) return null;

  const totalFriends = friends.length;
  const visibleFriends = friends.slice(0, 3);
  const overflowCount = Math.max(0, totalFriends - 3);

  // Generate name-drop label
  const getName = (friend: typeof friends[0]) => 
    friend.profile.display_name || friend.profile.username || 'A friend';

  let label: string;
  
  if (totalFriends === 1) {
    label = `${getName(friends[0])} is on their Top 100 journey too.`;
  } else if (totalFriends === 2) {
    label = `${getName(friends[0])} and ${getName(friends[1])} are doing their Top 100 journey.`;
  } else if (totalFriends === 3) {
    label = `${getName(friends[0])}, ${getName(friends[1])} and 1 other are doing their Top 100 journey.`;
  } else {
    label = `${getName(friends[0])}, ${getName(friends[1])} and ${totalFriends - 2} others are doing their Top 100 journey.`;
  }

  const handleClick = () => {
    // Placeholder: navigate to Friends' Top 100 Progress page when implemented
    navigate('/top100?tab=friends-progress');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-between text-left mt-3 px-1"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-slate-600">
          {label}
        </span>
      </div>

      <div className="flex items-center ml-3 shrink-0">
        {visibleFriends.map((friend, index) => {
          const displayName = friend.profile.display_name || friend.profile.username || '?';
          const initial = displayName[0]?.toUpperCase() || '?';
          
          return friend.profile.profile_photo_url ? (
            <SquircleImage
              key={friend.user_id}
              src={friend.profile.profile_photo_url}
              alt={displayName}
              size={36}
              className={`shrink-0 ${index > 0 ? '-ml-2' : ''}`}
            />
          ) : (
            <div
              key={friend.user_id}
              className={`w-9 h-9 flex items-center justify-center bg-muted text-foreground text-xs font-semibold shrink-0 ${index > 0 ? '-ml-2' : ''}`}
              style={{ borderRadius: '22%' }}
            >
              {initial}
            </div>
          );
        })}

        {overflowCount > 0 && (
          <div 
            className="w-9 h-9 flex items-center justify-center bg-muted text-foreground text-xs font-semibold shrink-0 -ml-2"
            style={{ borderRadius: '22%' }}
          >
            +{overflowCount}
          </div>
        )}

        <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
};
