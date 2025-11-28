import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SquircleImage from '@/components/ui/SquircleImage';
import type { FriendCourseActivity } from '@/hooks/useFriendsWhoPlayedCourse';

interface FriendsWhoPlayedSummaryCardProps {
  courseId: string;
  courseName: string;
  friends: FriendCourseActivity[];
}

export const FriendsWhoPlayedSummaryCard: React.FC<FriendsWhoPlayedSummaryCardProps> = ({
  courseId,
  friends,
}) => {
  const navigate = useNavigate();

  const totalFriends = friends.length;
  const visibleFriends = friends.slice(0, 3);
  const overflowCount = Math.max(0, totalFriends - visibleFriends.length);

  const label =
    totalFriends === 1
      ? '1 friend has logged a round here'
      : `${totalFriends} friends have logged a round here`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}/friends`)}
      className="w-full rounded-3xl bg-card shadow-sm px-4 py-4 flex items-center justify-between hover:bg-muted/60 transition"
    >
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium text-foreground">
          Friends who've played here
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {visibleFriends.map((friend) => {
          const displayName = friend.profile.display_name || friend.profile.username || '?';
          return (
            <SquircleImage
              key={friend.user_id}
              src={friend.profile.profile_photo_url || ''}
              alt={displayName}
              size={32}
              className="shrink-0"
            />
          );
        })}

        {overflowCount > 0 && (
          <div className="flex items-center justify-center rounded-[18px] bg-muted px-2 h-8 text-xs font-medium text-muted-foreground shrink-0">
            +{overflowCount}
          </div>
        )}

        <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
};
