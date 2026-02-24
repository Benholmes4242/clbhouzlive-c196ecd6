import React from 'react';
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
      className="rounded-[14px] p-3 cursor-pointer group transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      style={{
        background: 'white',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onClick={handleCourseClick}
    >
      <div className="flex gap-3">
        {/* Friend Avatar */}
        <button
          className="shrink-0 focus:outline-none"
          onClick={handleFriendClick}
        >
          <img
            src={hit.friend_profile.profile_photo_url || '/placeholder.svg'}
            alt={friendName}
            className="w-9 h-9 rounded-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
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
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#40916C' }}>
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
            style={{ border: '1px solid rgba(0,0,0,0.04)' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityFeedItem;
