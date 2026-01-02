import React, { useState } from 'react';
import { Squircle } from '@/components/ui/squircle';
import { Bookmark, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface ActivityClusterProps {
  courseId: string;
  courseName: string;
  thumbnailUrl: string | null;
  friends: FriendCourseHit[];
  mostRecentPlayedAt: string;
  onSave?: (courseId: string) => void;
  index?: number;
}

const ActivityCluster: React.FC<ActivityClusterProps> = ({
  courseId,
  courseName,
  thumbnailUrl,
  friends,
  mostRecentPlayedAt,
  onSave,
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

  const handleCourseClick = () => {
    navigate(`/courses/${courseId}`);
  };

  const handleFriendClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${username}`);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(courseId);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="bg-card border border-border/60 rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
      onClick={handleCourseClick}
    >
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar Stack */}
          <div className="shrink-0 flex -space-x-2">
            {sortedFriends.slice(0, 4).map((friend, idx) => (
              <div
                key={friend.friend_id}
                className="relative"
                style={{ zIndex: 10 - idx }}
                onClick={(e) => handleFriendClick(friend.friend_profile.username, e)}
              >
                <Squircle width={36} height={36}>
                  <img
                    src={friend.friend_profile.profile_photo_url || '/placeholder.svg'}
                    alt={friend.friend_profile.display_name || friend.friend_profile.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </Squircle>
              </div>
            ))}
            {friends.length > 4 && (
              <div
                className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600"
                style={{ zIndex: 5 }}
              >
                +{friends.length - 4}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Headline */}
            <p className="text-sm font-semibold text-foreground">
              {friends.length} friends played {courseName}
            </p>

            {/* Subline */}
            <p className="text-xs text-slate-400 mt-0.5">
              Most recent:{' '}
              <span className="text-slate-500">{mostRecentName}</span>
              <span className="mx-1">·</span>
              {formatDistanceToNow(new Date(mostRecentPlayedAt), { addSuffix: true })}
            </p>
          </div>

          {/* Course Thumbnail */}
          <div className="shrink-0">
            <Squircle width={56} height={56}>
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

        {/* Actions + Expand */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted hover:text-foreground transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={handleCourseClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View course
            </button>
          </div>

          {friends.length > 2 && (
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? 'Hide' : `Show ${friends.length} friends`}
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Friend List */}
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
              <div className="border-t border-border/40 pt-3 space-y-2">
                {sortedFriends.map((friend) => (
                  <div
                    key={`${friend.friend_id}-${friend.played_at}`}
                    className="flex items-center gap-2 py-1"
                    onClick={(e) => handleFriendClick(friend.friend_profile.username, e)}
                  >
                    <Squircle width={28} height={28} className="shrink-0">
                      <img
                        src={friend.friend_profile.profile_photo_url || '/placeholder.svg'}
                        alt={friend.friend_profile.display_name || friend.friend_profile.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </Squircle>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {friend.friend_profile.display_name || friend.friend_profile.username}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(friend.played_at), { addSuffix: true })}
                    </p>
                  </div>
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
