import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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

  // Compute friends' average score
  const friendsWithScores = friends.filter(f => f.rating_value != null);
  const friendsAvgScore = friendsWithScores.length > 0
    ? (friendsWithScores.reduce((sum, f) => sum + (f.rating_value ?? 0), 0) / friendsWithScores.length).toFixed(1)
    : null;

  const subtitle = (() => {
    const countText = `${totalFriends} ${totalFriends === 1 ? 'friend' : 'friends'} played`;

    if (!friendsWithScores.length) {
      return <>{countText} here</>;
    }

    if (friendsWithScores.length === 1) {
      return (
        <>
          {countText}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <span className="text-foreground font-medium">
            Rated {friendsWithScores[0].rating_value!.toFixed(1)}
          </span>
        </>
      );
    }

    return (
      <>
        {countText}
        <span className="mx-1.5 text-muted-foreground/40">·</span>
        <span className="text-foreground font-medium">
          Avg {friendsAvgScore}
        </span>
      </>
    );
  })();

  return (
    <button
      type="button"
      onClick={() => navigate('/golferssharedcourses')}
      className="w-full rounded-3xl bg-card shadow-sm px-4 py-4 flex items-center justify-between hover:bg-muted/60 transition text-left"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">
          Friends who've played here
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          {subtitle}
        </span>
      </div>

      <div className="flex items-center ml-3 shrink-0">
        {visibleFriends.map((friend, index) => {
          const displayName = friend.profile.display_name || friend.profile.username || '?';
          const initial = displayName[0]?.toUpperCase() || '?';
          
          return friend.profile.profile_photo_url ? (
            <SquircleAvatar
              key={friend.user_id}
              src={friend.profile.profile_photo_url}
              alt={displayName}
              size={36}
              className={index > 0 ? '-ml-2' : ''}
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