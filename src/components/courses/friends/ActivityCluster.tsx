import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronDown } from 'lucide-react';
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

  const sortedFriends = [...friends].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );

  const mostRecentFriend = sortedFriends[0];
  const mostRecentName =
    mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username;

  const handleCourseClick = () => navigate(`/courses/${courseId}`);
  const handleFriendClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${username}`);
  };
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      className="rounded-2xl p-3 cursor-pointer bg-card border border-border/50 active:scale-[0.98] transition-transform"
      onClick={handleCourseClick}
    >
      <div className="flex gap-3">
        {/* Stacked avatars */}
        <div className="shrink-0 flex -space-x-1.5 mt-0.5">
          {sortedFriends.slice(0, 2).map((f, idx) => (
            <button
              key={f.friend_id}
              className="relative focus:outline-none"
              style={{ zIndex: 10 - idx }}
              onClick={(e) => handleFriendClick(f.friend_profile.username, e)}
            >
                <SquircleAvatar
                  size={36}
                  src={f.friend_profile.profile_photo_url}
                  alt={f.friend_profile.display_name || f.friend_profile.username}
                  fallback={(f.friend_profile.display_name || f.friend_profile.username || '?').charAt(0)}
                  hideRing
                />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-foreground">{friends.length} friends</span>
            <span className="text-muted-foreground"> played</span>
          </p>
          <p className="text-sm font-semibold mt-0.5 text-foreground">
            {courseName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Most recent: {mostRecentName} · {formatDistanceToNow(new Date(mostRecentPlayedAt), { addSuffix: true })}
          </p>
        </div>

        {/* Course Thumbnail */}
        <div className="shrink-0">
          <img
            src={thumbnailUrl || '/placeholder.svg'}
            alt={courseName}
            className="w-14 h-14 rounded-[10px] object-cover"
            style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        </div>
      </div>

      {/* Expand toggle */}
      {friends.length > 1 && (
        <button
          onClick={toggleExpand}
          className="flex items-center gap-1 text-xs text-muted-foreground mt-2 pt-2 transition-colors active:opacity-70"
          style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}
        >
          {isExpanded ? 'Hide friends' : `Show ${friends.length} friends`}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      )}

      {/* Expanded list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1">
              {sortedFriends.map((friend) => (
                <button
                  key={`${friend.friend_id}-${friend.played_at}`}
                  className="w-full flex items-center justify-between py-1.5 px-1 rounded-lg active:bg-muted/40 transition-colors"
                  onClick={(e) => handleFriendClick(friend.friend_profile.username, e)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                      <SquircleAvatar
                        size={28}
                        src={friend.friend_profile.profile_photo_url}
                        alt={friend.friend_profile.display_name || friend.friend_profile.username}
                        fallback={(friend.friend_profile.display_name || friend.friend_profile.username || '?').charAt(0)}
                        hideRing
                      />
                    <p className="text-sm font-medium text-foreground truncate">
                      {friend.friend_profile.display_name || friend.friend_profile.username}
                    </p>
                  </div>
                  {friend.rating ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <ClubhouseLogo size="xs" />
                      <span
                        className="text-sm font-semibold tabular-nums text-foreground"
                        style={friend.rating >= 9.0 ? { color: 'hsl(var(--accent-amber))' } : undefined}
                      >{friend.rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityCluster;
