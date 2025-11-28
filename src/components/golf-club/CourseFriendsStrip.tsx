import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SquircleImage from '@/components/ui/SquircleImage';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseFriendsStripProps {
  courseId: string;
  courseName: string;
}

export const CourseFriendsStrip: React.FC<CourseFriendsStripProps> = ({ courseId, courseName }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  
  const { data: friends = [] } = useFriendsWhoPlayedCourse(user?.id, courseId);

  if (!user || friends.length === 0) return null;

  const totalFriends = friends.length;
  const visibleFriends = friends.slice(0, 3);
  const overflowCount = Math.max(0, totalFriends - 3);

  const label =
    totalFriends === 1
      ? '1 friend has logged a round here'
      : `${totalFriends} friends have logged a round here`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}/friends`)}
      className="w-full rounded-3xl bg-card shadow-sm px-4 py-4 flex items-center justify-between hover:bg-muted/60 transition mt-6"
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
          const initial = displayName[0]?.toUpperCase() || '?';
          
          return friend.profile.profile_photo_url ? (
            <SquircleImage
              key={friend.user_id}
              src={friend.profile.profile_photo_url}
              alt={displayName}
              size={36}
            />
          ) : (
            <div
              key={friend.user_id}
              className="w-9 h-9 flex items-center justify-center bg-muted text-foreground text-xs font-semibold"
              style={{ borderRadius: '20%' }}
            >
              {initial}
            </div>
          );
        })}

        {overflowCount > 0 && (
          <div className="flex items-center justify-center rounded-[18px] bg-muted px-2 h-9 text-xs font-medium text-muted-foreground">
            +{overflowCount}
          </div>
        )}

        <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
};
