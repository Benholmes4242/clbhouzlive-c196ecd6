import React, { useState } from 'react';
import { Squircle } from '@/components/ui/squircle';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface ActivityClusterProps {
  courseId: string;
  courseName: string;
  thumbnailUrl: string | null;
  friends: FriendCourseHit[];
  mostRecentPlayedAt: string;
  communityRating?: number | null;
  index?: number;
}

const ActivityCluster: React.FC<ActivityClusterProps> = ({
  courseId,
  courseName,
  thumbnailUrl,
  friends,
  mostRecentPlayedAt,
  communityRating,
  index = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Sort friends by most recent first
  const sortedFriends = [...friends].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );

  const mostRecentFriend = sortedFriends[0];
  const mostRecentName =
    mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username;

  // Format time compactly
  const formatTimeCompact = (date: string) => {
    const distance = formatDistanceToNow(new Date(date), { addSuffix: false });
    return distance
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' weeks', 'w')
      .replace(' week', 'w')
      .replace(' months', 'mo')
      .replace(' month', 'mo')
      .replace('about ', '')
      .replace('less than a', '<1');
  };

  const handleCourseClick = () => {
    navigate(`/courses/${courseId}`);
  };

  const handleFriendClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${username}`);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const scoreColor = communityRating && communityRating >= 9.0 ? 'text-amber-500' : 'text-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="bg-card border border-border/60 rounded-xl overflow-hidden hover:shadow-md active:scale-[0.98] active:shadow-sm transition-all cursor-pointer group"
      onClick={handleCourseClick}
    >
      <div className="p-4">
        {/* Row 1: Title + meta (left) | Thumbnail + rating (right) */}
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {/* Headline */}
            <p className="text-sm font-semibold text-foreground">
              {friends.length} friends played {courseName}
            </p>
            {/* Subline */}
            <p className="text-xs text-muted-foreground mt-0.5">
              Most recent: <span className="text-muted-foreground">{mostRecentName}</span> · {formatTimeCompact(mostRecentPlayedAt)} ago
            </p>
          </div>

          {/* Right side: Thumbnail only */}
          <div className="shrink-0">
            <Squircle width={56} height={56} className="ring-1 ring-border/30 transition-transform group-hover:scale-105">
              <img
                src={thumbnailUrl || '/placeholder.svg'}
                alt={courseName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </Squircle>
          </div>
        </div>

        {/* Row 2: Avatar stack + Community rating (aligned with image) */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex -space-x-2">
            {sortedFriends.slice(0, 4).map((friend, idx) => (
              <button
                key={friend.friend_id}
                className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg hover:z-20 transition-transform hover:scale-110"
                style={{ zIndex: 10 - idx }}
                onClick={(e) => handleFriendClick(friend.friend_profile.username, e)}
              >
                <Squircle width={32} height={32} className="ring-2 ring-card shadow-sm">
                  <img
                    src={friend.friend_profile.profile_photo_url || '/placeholder.svg'}
                    alt={`${friend.friend_profile.display_name || friend.friend_profile.username}'s profile`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </Squircle>
              </button>
            ))}
            {friends.length > 4 && (
              <div
                className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-muted border-2 border-card shadow-sm text-xs font-medium text-muted-foreground"
                style={{ zIndex: 5 }}
              >
                +{friends.length - 4}
              </div>
            )}
          </div>

          {/* Community rating - aligned under image */}
          {communityRating && (
            <div className="flex items-center gap-1 w-14 justify-center">
              <ClubhouseLogo className="h-4 w-4" />
              <span className={cn("text-xs font-semibold tabular-nums", scoreColor)}>{communityRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Row 3: Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <button
            onClick={handleCourseClick}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-xs font-medium text-primary bg-primary/5 border border-primary/15 hover:bg-primary/10 active:scale-[0.97] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View course
          </button>

          {friends.length > 1 && (
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground min-h-[44px] px-3 py-2 rounded-md hover:bg-muted active:scale-[0.97] transition-all"
            >
              {isExpanded ? 'Hide' : 'Show friends'}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Friend List with ratings */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="border-t border-border/40 pt-3 space-y-1">
                {sortedFriends.map((friend) => (
                  <motion.button
                    key={`${friend.friend_id}-${friend.played_at}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors"
                    onClick={(e) => handleFriendClick(friend.friend_profile.username, e)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Squircle width={28} height={28} className="shrink-0">
                        <img
                          src={friend.friend_profile.profile_photo_url || '/placeholder.svg'}
                          alt={`${friend.friend_profile.display_name || friend.friend_profile.username}'s profile`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </Squircle>
                      <p className="text-sm font-medium text-foreground truncate">
                        {friend.friend_profile.display_name || friend.friend_profile.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {friend.rating ? (
                        <>
                          <ClubhouseLogo size="xs" />
                          <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            friend.rating >= 9.0 ? 'text-amber-500' : 'text-foreground'
                          )}>{friend.rating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityCluster;
