import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { ExternalLink, Flame } from 'lucide-react';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="bg-card/60 border border-border/50 rounded-xl p-3.5 hover:shadow-md active:scale-[0.98] active:shadow-sm transition-all cursor-pointer group"
      onClick={handleCourseClick}
    >
      <div className="flex gap-3">
        {/* Friend Avatar */}
        <button 
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg hover:scale-105 transition-transform" 
          onClick={handleFriendClick}
        >
          <Squircle width={40} height={40} className="ring-1 ring-border/30">
            <img
              src={hit.friend_profile.profile_photo_url || '/placeholder.svg'}
              alt={`${friendName}'s profile`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </Squircle>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Action line */}
          <p className="text-sm">
            <button
              className="font-semibold text-foreground hover:underline cursor-pointer focus:outline-none"
              onClick={handleFriendClick}
            >
              {friendName}
            </button>
            <span className="text-muted-foreground"> played </span>
            <span className="font-medium text-foreground">{hit.course_name}</span>
          </p>

          {/* Meta line */}
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}
            {isTrending && (
              <>
                <span className="mx-1.5">·</span>
                <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                  <Flame className="w-2.5 h-2.5" />
                  Trending
                </span>
              </>
            )}
          </p>
        </div>

        {/* Course Thumbnail */}
        <div className="shrink-0">
          <Squircle width={56} height={56} className="ring-1 ring-border/30 transition-transform group-hover:scale-105">
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

      {/* Actions - only View course */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
        <button
          onClick={handleCourseClick}
          className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-xs font-medium text-primary bg-primary/5 border border-primary/15 hover:bg-primary/10 active:scale-[0.97] transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View course
        </button>
      </div>
    </motion.div>
  );
};

export default ActivityFeedItem;
