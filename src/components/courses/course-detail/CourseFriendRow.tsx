import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import SquircleImage from '@/components/ui/SquircleImage';
import type { FriendCourseActivity } from '@/hooks/useFriendsWhoPlayedCourse';

interface CourseFriendRowProps {
  friend: FriendCourseActivity;
  onOpenProfile: (userId: string) => void;
  onViewReview: (friend: FriendCourseActivity) => void;
}

export const CourseFriendRow: React.FC<CourseFriendRowProps> = ({
  friend,
  onOpenProfile,
  onViewReview,
}) => {
  const displayName = friend.profile.display_name || friend.profile.username || '?';
  const lastPlayed = friend.last_played_at
    ? formatDistanceToNow(new Date(friend.last_played_at), { addSuffix: true })
    : 'recently';

  const rightLabel = friend.has_review ? 'View review' : 'View round';

  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
      {/* Left side: avatar + name + last played */}
      <button
        type="button"
        onClick={() => onOpenProfile(friend.user_id)}
        className="flex items-center gap-3 flex-1 text-left min-w-0"
      >
        <SquircleImage
          src={friend.profile.profile_photo_url || ''}
          alt={displayName}
          size={40}
          className="shrink-0"
        />

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            Last played {lastPlayed}
            {friend.has_review && ' · Left a review'}
          </span>
        </div>
      </button>

      {/* Right side: pill button */}
      <button
        type="button"
        onClick={() => onViewReview(friend)}
        className="ml-3 shrink-0 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90 transition"
      >
        {rightLabel}
      </button>
    </div>
  );
};
