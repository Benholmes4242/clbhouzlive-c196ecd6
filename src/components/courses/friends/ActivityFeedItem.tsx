import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { Bookmark, ExternalLink, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface ActivityFeedItemProps {
  hit: FriendCourseHit;
  isTrending?: boolean;
  onSave?: (courseId: string) => void;
  index?: number;
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  hit,
  isTrending = false,
  onSave,
  index = 0,
}) => {
  const navigate = useNavigate();

  const friendName = hit.friend_profile.display_name || hit.friend_profile.username;

  const handleFriendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${hit.friend_profile.username}`);
  };

  const handleCourseClick = () => {
    navigate(`/courses/${hit.course_id}`);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(hit.course_id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={handleCourseClick}
    >
      <div className="flex gap-3">
        {/* Friend Avatar */}
        <div className="shrink-0" onClick={handleFriendClick}>
          <Squircle width={40} height={40}>
            <img
              src={hit.friend_profile.profile_photo_url || '/placeholder.svg'}
              alt={friendName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </Squircle>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Action line */}
          <p className="text-sm">
            <span
              className="font-semibold text-foreground hover:underline cursor-pointer"
              onClick={handleFriendClick}
            >
              {friendName}
            </span>
            <span className="text-muted-foreground"> played </span>
            <span className="font-medium text-foreground">{hit.course_name}</span>
          </p>

          {/* Meta line */}
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}
            {isTrending && (
              <>
                <span className="mx-1.5">·</span>
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <Flame className="w-3 h-3" />
                  Trending
                </span>
              </>
            )}
          </p>
        </div>

        {/* Course Thumbnail */}
        <div className="shrink-0">
          <Squircle width={56} height={56}>
            <img
              src={hit.thumbnail_url || '/placeholder.svg'}
              alt={hit.course_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </Squircle>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
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
    </motion.div>
  );
};

export default ActivityFeedItem;
