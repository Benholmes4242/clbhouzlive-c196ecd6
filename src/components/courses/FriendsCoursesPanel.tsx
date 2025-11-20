import React, { useState, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users, MapPin, Flame } from 'lucide-react';
import { FLAGS } from '@/config/flags';
import { MOCK_FRIEND_COURSES } from './mockFriendCourses';
import type { CourseWithFriends, FriendCourseHit } from '@/hooks/useFriendsCourses';

type TimeRange = '30' | '90' | 'all';

const FriendsCoursesPanel: React.FC = () => {
  // All hooks must be called before any conditional returns
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: realData, isLoading } = useFriendsCourses(user?.id);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  
  // Use mock data when flag is enabled
  const data = FLAGS.FRIEND_COURSES_MOCK_ENABLED ? MOCK_FRIEND_COURSES : realData;

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (!data) return null;
    if (timeRange === 'all') return data;
    
    const days = timeRange === '30' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const filteredRecent = data.recent.filter(hit => 
      new Date(hit.played_at) >= cutoff
    );
    
    const filteredCourses = data.courses
      .map(course => ({
        ...course,
        friends: course.friends.filter(hit => 
          new Date(hit.played_at) >= cutoff
        ),
      }))
      .filter(course => course.friends.length > 0);
    
    const uniqueFriends = new Set(filteredRecent.map(hit => hit.friend_id));
    
    return {
      courses: filteredCourses,
      recent: filteredRecent,
      totalCourses: filteredCourses.length,
      totalFriendsActive: uniqueFriends.size,
    };
  }, [data, timeRange]);

  // Derive lists safely even while loading
  const courses = filteredData?.courses || [];
  const recent = filteredData?.recent || [];
  const totalCourses = filteredData?.totalCourses || 0;
  const totalFriendsActive = filteredData?.totalFriendsActive || 0;

  // Hot courses: courses with 2+ friends, sorted by friends then recency
  const hotCourses = useMemo(() => {
    return courses
      .filter(course => course.total_friends_played >= 2)
      .sort((a, b) => {
        if (b.total_friends_played !== a.total_friends_played) {
          return b.total_friends_played - a.total_friends_played;
        }
        return (
          new Date(b.most_recent_play).getTime() -
          new Date(a.most_recent_play).getTime()
        );
      })
      .slice(0, 4);
  }, [courses]);

  const regularCourses = useMemo(() => {
    const hotIds = new Set(hotCourses.map(c => c.course_id));
    return courses.filter(c => !hotIds.has(c.course_id));
  }, [courses, hotCourses]);

  // Now conditional returns - no more hooks after this point
  if (!user) return null;

  // Show skeleton only while loading AND before we have any filtered data
  if (isLoading && !filteredData) {
    return (
      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Friends' Courses
            </h2>
            <p className="text-sm text-muted-foreground">
              See where your friends have been playing lately.
            </p>
          </div>
        </div>

        {/* simple skeleton cards */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-muted/80 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state: no courses from friends in this time range

  if (totalCourses === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <span className="text-lg">👥</span>
        </div>
        <h3 className="text-base font-semibold mb-1">No friends added yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Follow or add golfers to see where they've been playing.
        </p>
        <button
          type="button"
          onClick={() => navigate('/discover/people')}
          className="inline-flex h-10 items-center rounded-full bg-[#3A3F46] px-5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
        >
          Find golfers to follow
        </button>
      </div>
    );
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const formatFriendsList = (friends: FriendCourseHit[], limit = 3) => {
    const names = friends.slice(0, limit).map(f => f.friend_profile.display_name || f.friend_profile.username);
    const remaining = friends.length - limit;
    return remaining > 0 ? `${names.join(', ')} and ${remaining} other${remaining > 1 ? 's' : ''}` : names.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Friends' Courses</h2>
          <p className="text-sm text-muted-foreground">See where your friends have been playing lately.</p>
        </div>
        
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground">
            {timeRange === '30' ? 'This month' : timeRange === '90' ? 'Last 90 days' : 'All time'} · {totalCourses} course{totalCourses !== 1 ? 's' : ''} · {totalFriendsActive} friend{totalFriendsActive !== 1 ? 's' : ''} active
          </div>
          
          <div className="flex gap-1 p-0.5 bg-surface-alt rounded-lg border border-border/60">
            {(['30', '90', 'all'] as const).map((range) => (
              <button key={range} onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  timeRange === range ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {range === 'all' ? 'All time' : `${range === '30' ? 'Last 30' : '90'} days`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hotCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary-accent" />
              <h3 className="text-sm font-semibold">Hot in your network</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-alt text-muted-foreground">
              Courses multiple friends played recently
            </span>
          </div>

          <div className="space-y-3">
            {hotCourses.map((course) => (
              <Card key={course.course_id} className="p-4 hover:shadow-md transition-all cursor-pointer bg-surface-card border-border/60"
                onClick={() => navigate(`/courses/${course.course_id}`)}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base">{course.course_name}</h3>
                      <p className="text-sm text-muted-foreground">{course.country}{course.sub_country ? `, ${course.sub_country}` : ''}</p>
                    </div>
                    {course.global_rank && <Badge variant="outline" className="shrink-0 text-xs">#{course.global_rank}</Badge>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {course.friends.slice(0, 3).map((friend) => (
                          <Avatar key={friend.friend_id} className="w-7 h-7 border-2 border-background">
                            <AvatarImage src={friend.friend_profile.profile_photo_url || ''} />
                            <AvatarFallback className="text-xs bg-surface-slate text-white">
                              {getInitials(friend.friend_profile.display_name || friend.friend_profile.username)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Played by {formatFriendsList(course.friends, 2)}</span>
                    </div>
                    <Badge className="bg-primary-accent/10 text-primary-accent border-primary-accent/20 text-xs">Hot this month</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {regularCourses.length > 0 && (
        <div className="space-y-3">
          {regularCourses.map((course) => {
            const mostRecentFriend = course.friends[0];
            return (
              <Card key={course.course_id} className="relative p-4 hover:shadow-md transition-all cursor-pointer bg-surface-card border-border/60"
                onClick={() => navigate(`/courses/${course.course_id}`)}>
                <Avatar className="absolute -top-2 -left-2 w-9 h-9 border-2 border-background shadow-sm">
                  <AvatarImage src={mostRecentFriend.friend_profile.profile_photo_url || ''} />
                  <AvatarFallback className="text-xs bg-surface-slate text-white">
                    {getInitials(mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 pl-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base">{course.course_name}</h3>
                      <p className="text-sm text-muted-foreground">{course.country}{course.sub_country ? `, ${course.sub_country}` : ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last played by {mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username} · {formatDistanceToNow(new Date(mostRecentFriend.played_at), { addSuffix: true })}
                      </p>
                    </div>
                    {course.global_rank && <Badge variant="outline" className="shrink-0 text-xs">#{course.global_rank}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Played by {course.total_friends_played} friend{course.total_friends_played !== 1 ? 's' : ''}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Recent rounds</h3>
            <p className="text-xs text-muted-foreground mt-0.5">A feed of your friends' latest logged courses</p>
          </div>
          <div className="divide-y divide-border/60">
            {recent.slice(0, 15).map((hit, idx) => (
              <div key={`${hit.friend_id}-${hit.course_id}-${idx}`}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-surface-alt/30 -mx-2 px-2 rounded transition-colors"
                onClick={() => navigate(`/courses/${hit.course_id}`)}>
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={hit.friend_profile.profile_photo_url || ''} />
                  <AvatarFallback className="text-xs bg-surface-slate text-white">
                    {getInitials(hit.friend_profile.display_name || hit.friend_profile.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{hit.friend_profile.display_name || hit.friend_profile.username}</span> played {hit.course_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsCoursesPanel;
