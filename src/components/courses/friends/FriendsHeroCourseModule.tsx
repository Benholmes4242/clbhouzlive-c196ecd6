import React from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Top100RankBadge } from '@/components/top100/Top100RankBadge';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsHeroCourseModuleProps {
  course: CourseWithFriends;
  label?: string;
  onClick?: () => void;
}

const FriendsHeroCourseModule: React.FC<FriendsHeroCourseModuleProps> = ({
  course,
  label = 'Most popular this month',
  onClick,
}) => {
  const navigate = useNavigate();
  const mostRecentFriend = course.friends[0];
  const ranks = extractRanksFromMemberships(course.top100_memberships, course.country);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/courses/${course.course_id}`);
    }
  };

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Featured</h3>
        <p className="text-sm text-muted-foreground">Based on your network this month</p>
      </div>

      {/* Hero card - pointed corners, NO community rating */}
      <Card
        className="relative overflow-hidden rounded-none hover:shadow-lg transition-all cursor-pointer bg-card border border-border/20 shadow-sm"
        onClick={handleClick}
      >
        {/* Course Image */}
        {course.thumbnail_url && (
          <div className="relative w-full aspect-[1.77/1] overflow-hidden">
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
        <div className="px-4 py-3 space-y-1.5">
          {/* Course name & location with pill on RIGHT */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {course.course_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {course.country}
                {course.sub_country ? `, ${course.sub_country}` : ''}
              </p>
            </div>
            {/* Highlight label pill - RIGHT aligned */}
            <span className="shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-full bg-primary/10 border border-primary/20 text-primary whitespace-nowrap">
              {label}
            </span>
          </div>

          {/* Friend line with avatar */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <p className="text-xs text-muted-foreground">
              Played by{' '}
              <span className="font-medium text-foreground">
                {mostRecentFriend.friend_profile.display_name ||
                  mostRecentFriend.friend_profile.username}
              </span>
              {course.total_friends_played > 1 && (
                <span> & {course.total_friends_played - 1} more</span>
              )}
              {' '}·{' '}
              {formatDistanceToNow(new Date(mostRecentFriend.played_at), {
                addSuffix: true,
              })}
            </p>

            <Squircle width={36} height={36} className="shrink-0">
              <img
                src={
                  mostRecentFriend.friend_profile.profile_photo_url ||
                  '/placeholder.svg'
                }
                alt={
                  mostRecentFriend.friend_profile.display_name ||
                  mostRecentFriend.friend_profile.username
                }
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </Squircle>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FriendsHeroCourseModule;
