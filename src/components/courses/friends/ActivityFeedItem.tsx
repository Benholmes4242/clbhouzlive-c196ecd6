import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface ActivityFeedItemProps {
  hit: FriendCourseHit;
  isTrending?: boolean;
  index?: number;
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  hit,
  isTrending = false,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      className="rounded-[14px] p-3 cursor-pointer group transition-shadow bg-card border border-border/30"
      style={{
        boxShadow: '0 1px 3px hsl(var(--foreground) / 0.04)',
      }}
      onClick={handleCourseClick}
    >
      <div className="flex gap-3">
        {/* Friend Avatar */}
        <button
          className="shrink-0 focus:outline-none"
          onClick={handleFriendClick}
        >
            <SquircleAvatar
              size={36}
              src={hit.friend_profile.profile_photo_url}
              alt={friendName}
              fallback={friendName.charAt(0)}
              hideRing
            />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <button
              className="font-semibold text-foreground hover:underline"
              onClick={handleFriendClick}
            >
              {friendName}
            </button>
            <span className="text-muted-foreground"> played</span>
          </p>
          <p className="text-sm font-semibold mt-0.5 text-foreground">
            {hit.course_name}
          </p>
          {(hit.course_country) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {hit.course_country}{hit.course_sub_country ? `, ${hit.course_sub_country}` : ''}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}
          </p>
        </div>

        {/* Course Thumbnail */}
        <div className="shrink-0">
          <img
            src={hit.thumbnail_url || '/placeholder.svg'}
            alt={hit.course_name}
            className="w-14 h-14 rounded-[10px] object-cover"
            style={{ border: '1px solid hsl(var(--border) / 0.3)' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityFeedItem;
