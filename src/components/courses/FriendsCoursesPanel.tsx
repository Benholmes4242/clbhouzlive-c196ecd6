import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const FriendsCoursesPanel: React.FC = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { data, isLoading } = useFriendsCourses(user?.id);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Friends' Courses</h2>
          <p className="text-sm text-muted-foreground">
            See where your friends have been playing recently.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="p-4 space-y-4">
            <Skeleton className="h-4 w-32" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </Card>
          <Card className="p-4 space-y-4">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </Card>
        </div>
      </div>
    );
  }

  const courses = data?.courses || [];
  const recent = data?.recent || [];
  const totalCourses = data?.totalCourses || 0;
  const totalFriendsActive = data?.totalFriendsActive || 0;

  // Empty state: no friends with rounds
  if (totalCourses === 0) {
    if (totalFriendsActive === 0) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Friends' Courses</h2>
            <p className="text-sm text-muted-foreground">
              Add friends to see where they've been playing.
            </p>
          </div>
          <Card className="p-6 flex flex-col items-start gap-3">
            <div className="text-base font-medium">No friends added yet</div>
            <p className="text-sm text-muted-foreground">
              Follow or add other golfers to see what courses they're playing
              and discover new places to play.
            </p>
            <Button variant="outline" onClick={() => navigate('/discover/people')}>
              Find golfers to follow
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Friends' Courses</h2>
          <p className="text-sm text-muted-foreground">
            See where your friends have been playing recently.
          </p>
        </div>
        <Card className="p-6 space-y-3">
          <div className="text-base font-medium">
            Your friends haven't logged any rounds yet
          </div>
          <p className="text-sm text-muted-foreground">
            Once they start logging courses in Clbhouz, their activity will
            appear here.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/courses?tab=explore')}
          >
            Explore courses instead
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-lg font-semibold">Friends' Courses</h2>
          <p className="text-sm text-muted-foreground">
            See where your friends have been playing recently.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-full">
            {totalCourses} course{totalCourses !== 1 ? 's' : ''} played
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {totalFriendsActive} friend{totalFriendsActive !== 1 ? 's' : ''}{' '}
            active in the last 90 days
          </Badge>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        {/* Hot in your network */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Hot in your network</h3>
              <p className="text-xs text-muted-foreground">
                Courses multiple friends have played recently.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {courses.map((course) => {
              const topFriends = course.friends.slice(0, 3);
              const extraCount = course.friends.length - topFriends.length;

              return (
                <button
                  key={course.course_id}
                  onClick={() => navigate(`/courses/${course.course_id}`)}
                  className="w-full text-left rounded-xl border border-border/60 bg-card/70 hover:bg-card transition-colors px-3.5 py-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {course.course_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {course.sub_country || course.country || 'Location'}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[11px] px-2 py-0">
                      Played by {course.total_friends_played}{' '}
                      friend{course.total_friends_played !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex -space-x-2">
                      {topFriends.map((hit) => (
                        <Avatar
                          key={hit.friend_id}
                          className="h-7 w-7 border border-background"
                        >
                          <AvatarImage
                            src={hit.friend_profile.profile_photo_url || ''}
                            alt={hit.friend_profile.display_name || ''}
                          />
                          <AvatarFallback className="text-[11px]">
                            {(
                              hit.friend_profile.display_name ||
                              hit.friend_profile.username ||
                              '?'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {extraCount > 0 && (
                        <div className="h-7 w-7 rounded-full border border-border bg-muted flex items-center justify-center text-[11px] text-muted-foreground">
                          +{extraCount}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Last played{' '}
                      {formatDistanceToNow(new Date(course.most_recent_play), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recent rounds */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Recent rounds</h3>
              <p className="text-xs text-muted-foreground">
                A feed of your friends' latest logged courses.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {recent.map((hit) => (
              <div
                key={`${hit.friend_id}-${hit.course_id}-${hit.played_at}`}
                className="flex items-center gap-3 rounded-lg hover:bg-card/60 px-2 py-2 cursor-pointer"
                onClick={() => navigate(`/courses/${hit.course_id}`)}
              >
                <Avatar
                  className="h-8 w-8 flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${hit.friend_profile.username}`);
                  }}
                >
                  <AvatarImage
                    src={hit.friend_profile.profile_photo_url || ''}
                    alt={hit.friend_profile.display_name || ''}
                  />
                  <AvatarFallback className="text-[11px]">
                    {(
                      hit.friend_profile.display_name ||
                      hit.friend_profile.username ||
                      '?'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-xs">
                    <button
                      className="font-medium hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${hit.friend_profile.username}`);
                      }}
                    >
                      {hit.friend_profile.display_name ||
                        hit.friend_profile.username ||
                        'Golfer'}
                    </button>{' '}
                    <span className="text-muted-foreground">
                      played{' '}
                      <button
                        className="font-medium hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${hit.course_id}`);
                        }}
                      >
                        {hit.course_name}
                      </button>
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(hit.played_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FriendsCoursesPanel;
