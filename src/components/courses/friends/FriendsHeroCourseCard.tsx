import React from 'react';
import { Squircle } from '@/components/ui/squircle';
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
      case 'most_played':
        return 'Most played this month';
      case 'highest_rated':
        return 'Highest rated this period';
      case 'new':
        return 'Recently discovered';
      default:
        return 'Most played this month';
    }
  };

  const friendName = mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username;
  const friendUsername = mostRecentFriend.friend_profile.username;

  // Get up to 3 friend avatars for stacking
  const avatarFriends = course.friends.slice(0, 3);
  const extraCount = course.total_friends_played - 3;

  const handleFriendClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    navigate(`/user/${username}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-none hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer bg-card border border-border/60 shadow-md group"
      onClick={() => navigate(`/courses/${course.course_id}`)}
    >
      {/* Course Image */}
      {course.thumbnail_url && (
        <div className="relative w-full aspect-[1.77/1] overflow-hidden">
          <img
            src={course.thumbnail_url}
            alt={course.course_name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {/* Bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
          
          {/* Rank badges (top-left) */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {ranks.globalRank && (
              <Top100RankBadge listSlug="global" rank={ranks.globalRank} />
            )}
            {ranks.usaRank && (
              <Top100RankBadge listSlug="usa" rank={ranks.usaRank} />
            )}
            {ranks.regionalRank && !ranks.usaRank && (
              <Top100RankBadge listSlug="gb-i" rank={ranks.regionalRank} />
            )}
          </div>
        </div>
      )}
      
      {/* Course Info */}
      <div className="px-4 py-3 space-y-3">
        {/* Course name with highlight pill on same line */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">
              {course.course_name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
            {getHighlightLabel()}
          </span>
        </div>

        {/* Friend meta + avatar stack */}
        <div className="flex items-center justify-between gap-3">
          {/* 2-line meta text block */}
          <div className="flex flex-col leading-snug">
            <p className="text-sm text-muted-foreground">
              Played by{" "}
              <button
                onClick={(e) => handleFriendClick(e, friendUsername)}
                className="font-medium text-foreground hover:underline focus:outline-none"
              >
                {friendName}
              </button>
              {course.total_friends_played > 1 && (
                <span> & {course.total_friends_played - 1} more</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(mostRecentFriend.played_at), { addSuffix: true })}
            </p>
          </div>

          {/* Avatar stack with shadows */}
          <div className="flex -space-x-2.5">
            {avatarFriends.map((friend, idx) => (
              <button
                key={friend.friend_id}
                onClick={(e) => handleFriendClick(e, friend.friend_profile.username)}
                className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-lg hover:z-20 transition-transform hover:scale-110"
                style={{ zIndex: 10 - idx }}
              >
                <Squircle width={36} height={36} className="ring-2 ring-card shadow-sm">
                  <img 
                    src={friend.friend_profile.profile_photo_url || '/placeholder.svg'} 
                    alt={friend.friend_profile.display_name || friend.friend_profile.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </Squircle>
              </button>
            ))}
            {extraCount > 0 && (
              <div 
                className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-muted border-2 border-card shadow-sm text-xs font-medium text-muted-foreground"
                style={{ zIndex: 6 }}
              >
                +{extraCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FriendsHeroCourseCard;
