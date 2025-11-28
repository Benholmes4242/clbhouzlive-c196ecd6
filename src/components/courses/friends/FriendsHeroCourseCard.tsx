import React from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import CourseRankBadges from '../CourseRankBadges';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsHeroCourseCardProps {
  course: CourseWithFriends;
  filterType: string;
}

const FriendsHeroCourseCard: React.FC<FriendsHeroCourseCardProps> = ({ course, filterType }) => {
  const navigate = useNavigate();
  const mostRecentFriend = course.friends[0];

  const getHighlightLabel = () => {
    switch (filterType) {
      case 'most_played':
        return 'Most popular course this month';
      case 'highest_rated':
        return 'Highest rated this period';
      case 'new':
        return 'Recently discovered';
      default:
        return 'Most popular course this month';
    }
  };

  return (
    <Card 
      className="relative overflow-hidden rounded-none sm:rounded-xl hover:shadow-lg transition-all cursor-pointer bg-card border border-border/60 shadow-md"
      onClick={() => navigate(`/courses/${course.course_id}`)}
    >
      {/* Course Image - Slightly taller */}
      {course.thumbnail_url && (
        <div className="relative w-full aspect-[1.6/1] overflow-hidden">
          <img
            src={course.thumbnail_url}
            alt={course.course_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {/* Bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
          
          {/* Rating badge (top-left) */}
          {course.average_rating != null && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-full border border-border bg-card/90 backdrop-blur-sm px-3 py-1 text-xs sm:text-[13px] font-medium text-foreground shadow-sm">
                {course.average_rating.toFixed(1)} /10
              </span>
            </div>
          )}
          
          {/* Rank badges (top-right) */}
          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            {(() => {
              const ranks = extractRanksFromMemberships(course.top100_memberships, course.country);
              return (
                <CourseRankBadges
                  globalRank={ranks.globalRank}
                  regionalRank={ranks.regionalRank}
                  usaRank={ranks.usaRank}
                  country={course.country || ''}
                  positioning="inline"
                />
              );
            })()}
          </div>
        </div>
      )}
      
      {/* Course Info */}
      <div className="p-4 space-y-2">
        {/* Highlight label */}
        <div className="inline-block px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-medium text-primary">{getHighlightLabel()}</span>
        </div>

        {/* Course name & location */}
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            {course.course_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
          </p>
        </div>

        {/* Friend line with avatar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Played by{" "}
            <span className="font-medium text-foreground">
              {mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username}
            </span>
            {course.total_friends_played > 1 && (
              <span> & {course.total_friends_played - 1} more</span>
            )}
            {" "}· {formatDistanceToNow(new Date(mostRecentFriend.played_at), { addSuffix: true })}
          </p>

          <Squircle width={36} height={36} className="shrink-0">
            <img 
              src={mostRecentFriend.friend_profile.profile_photo_url || '/placeholder.svg'} 
              alt={mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </Squircle>
        </div>
      </div>
    </Card>
  );
};

export default FriendsHeroCourseCard;
