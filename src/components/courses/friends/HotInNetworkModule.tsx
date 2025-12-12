import React from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from '../CourseRankBadges';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import type { CourseWithFriends, FriendCourseHit } from '@/hooks/useFriendsCourses';

interface HotInNetworkModuleProps {
  courses: CourseWithFriends[];
  helperPillText?: string;
}

const formatFriendsList = (friends: FriendCourseHit[], limit = 2) => {
  const names = friends
    .slice(0, limit)
    .map((f) => f.friend_profile.display_name || f.friend_profile.username);
  const remaining = friends.length - limit;
  return remaining > 0
    ? `${names.join(', ')} and ${remaining} other${remaining > 1 ? 's' : ''}`
    : names.join(', ');
};

const HotInNetworkModule: React.FC<HotInNetworkModuleProps> = ({
  courses,
  helperPillText = 'Multiple friends played recently',
}) => {
  const navigate = useNavigate();

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Hot in your network
          </h3>
        </div>
        <span className="px-3 h-7 rounded-full bg-muted/40 text-xs text-muted-foreground flex items-center">
          {helperPillText}
        </span>
      </div>

      {/* Course cards - pointed corners, NO community rating */}
      <div className="space-y-4">
        {courses.map((course) => {
          const ranks = extractRanksFromMemberships(
            course.top100_memberships,
            course.country
          );

          return (
            <Card
              key={course.course_id}
              className="overflow-hidden rounded-none hover:shadow-md transition-all cursor-pointer bg-card border-border/20"
              onClick={() => navigate(`/courses/${course.course_id}`)}
            >
              {/* Course Image */}
              {course.thumbnail_url && (
                <div className="relative w-full aspect-[1.7/1] overflow-hidden">
                  <CourseRankBadges
                    globalRank={ranks.globalRank}
                    regionalRank={ranks.regionalRank}
                    usaRank={ranks.usaRank}
                    country={course.country || ''}
                    positioning="top-left"
                  />

                  <img
                    src={course.thumbnail_url}
                    alt={course.course_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">
                      {course.course_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {course.country}
                      {course.sub_country ? `, ${course.sub_country}` : ''}
                    </p>
                  </div>
                  {/* Hot this month pill - RIGHT side, NO community rating */}
                  <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    Hot this month
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {course.friends.slice(0, 3).map((friend, idx) => (
                        <div
                          key={friend.friend_id}
                          className="relative"
                          style={{ zIndex: 10 - idx }}
                        >
                          <Squircle width={28} height={28}>
                            <img
                              src={
                                friend.friend_profile.profile_photo_url ||
                                '/placeholder.svg'
                              }
                              alt={
                                friend.friend_profile.display_name ||
                                friend.friend_profile.username
                              }
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </Squircle>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Played by {formatFriendsList(course.friends, 2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HotInNetworkModule;
