import React from 'react';
import { useNavigate } from 'react-router-dom';
import SquircleImage from '@/components/ui/SquircleImage';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ChevronRight } from 'lucide-react';

interface CourseFriendsStripProps {
  courseId: string;
  courseName: string;
}

export const CourseFriendsStrip: React.FC<CourseFriendsStripProps> = ({ courseId, courseName }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  
  const { data: friends = [] } = useFriendsWhoPlayedCourse(user?.id, courseId);

  // Only render if user is logged in and has friends who've played
  if (!user || friends.length === 0) return null;

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
      className="w-full rounded-3xl bg-card shadow-sm px-4 py-4 flex items-center justify-between hover:bg-muted/60 transition text-left"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">
          Friends who've played here
        </span>
        <span className="text-sm text-muted-foreground mt-1">
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
          <div className="flex items-center justify-center rounded-[18px] bg-muted px-2 h-9 text-xs font-medium text-muted-foreground shrink-0 -ml-2">
            +{overflowCount}
          </div>
        )}

        <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
};
