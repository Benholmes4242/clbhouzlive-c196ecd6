import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFriendsOnTop100Journey } from '@/hooks/useFriendsOnTop100Journey';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ChevronRight } from 'lucide-react';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';

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
    navigate('/top100?tab=friends-progress');
  };

  return (
    <div
      onClick={handleClick}
      className="mt-4 flex items-center justify-between cursor-pointer transition-opacity hover:opacity-80 active:scale-[0.97] transition-transform"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex -space-x-2">
          {visibleFriends.map((friend) => {
            const displayName = friend.profile.display_name || friend.profile.username || '?';
            const initial = displayName[0]?.toUpperCase() || '?';
            
            // Get achievement ring color based on friend's Top 100 progress
            const ringColor = friend.top100CoursesPlayed 
              ? getRingColorForTotalPlayed(friend.top100CoursesPlayed)
              : undefined;
            
            return friend.profile.profile_photo_url ? (
              <SquircleAvatar
                key={friend.user_id}
                src={friend.profile.profile_photo_url}
                alt={displayName}
                size={36}
                ringColor={ringColor}
              />
            ) : (
              <div
                key={friend.user_id}
                className="w-9 h-9 flex items-center justify-center bg-muted text-muted-foreground text-[11px] font-semibold shrink-0"
                style={{
                  borderRadius: '34%',
                  border: ringColor ? `2px solid ${ringColor}` : '2px solid hsl(var(--border))',
                }}
              >
                {initial}
              </div>
            );
          })}

          {overflowCount > 0 && (
            <div 
              className="flex h-9 w-9 items-center justify-center bg-muted text-[11px] font-semibold text-muted-foreground shrink-0"
              style={{ borderRadius: '34%', border: '2px solid hsl(var(--border))' }}
            >
              +{overflowCount}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
};
