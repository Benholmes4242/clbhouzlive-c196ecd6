import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Top100RankBadge } from '@/components/top100/Top100RankBadge';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import { motion } from 'framer-motion';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsHeroCourseCardProps {
  course: CourseWithFriends;
  filterType: string;
}

const FriendsHeroCourseCard: React.FC<FriendsHeroCourseCardProps> = ({ course, filterType }) => {
  const navigate = useNavigate();
  const mostRecentFriend = course.friends[0];
  const ranks = extractRanksFromMemberships(course.top100_memberships, course.country);

  const getHighlightLabel = () => {
    switch (filterType) {
      case 'most_played': return 'Most played this month';
      case 'highest_rated': return 'Highest rated this period';
      case 'new': return 'Recently discovered';
      default: return 'Most played this month';
    }
  };

  const friendName = mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username;
  const friendUsername = mostRecentFriend.friend_profile.username;

  const handleFriendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${friendUsername}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/courses/${course.course_id}`)}
    >
      {/* Course Image with overlay */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <img
          src={course.thumbnail_url || '/placeholder.svg'}
          alt={course.course_name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />
        
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Rank badges (top-left) */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {ranks.globalRank && <Top100RankBadge listSlug="global" rank={ranks.globalRank} />}
          {ranks.usaRank && <Top100RankBadge listSlug="usa" rank={ranks.usaRank} />}
          {ranks.regionalRank && !ranks.usaRank && <Top100RankBadge listSlug="gb-i" rank={ranks.regionalRank} />}
        </div>

        {/* Highlight badge (top-right) — frosted glass */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {getHighlightLabel()}
        </div>

        {/* Course info overlaid on image (bottom) */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-lg text-white leading-tight">
            {course.course_name}
          </h3>
          <p className="text-sm text-white/80 mt-0.5">
            {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
          </p>
        </div>
      </div>

      {/* Played by row below image */}
      <div className="flex items-center gap-2 px-4 py-2">
        <button onClick={handleFriendClick} className="shrink-0">
          <img
            src={mostRecentFriend.friend_profile.profile_photo_url || '/placeholder.svg'}
            alt={friendName}
            className="w-6 h-6 rounded-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        </button>
        <p className="text-sm text-muted-foreground">
          Played by{' '}
          <button onClick={handleFriendClick} className="font-semibold text-foreground hover:underline">
            {friendName}
          </button>
          {course.total_friends_played > 1 && (
            <span> & {course.total_friends_played - 1} more</span>
          )}
          <span className="mx-1">·</span>
          {formatDistanceToNow(new Date(mostRecentFriend.played_at), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );
};

export default FriendsHeroCourseCard;
