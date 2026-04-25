import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users, TrendingUp } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FriendsActivitySheet } from './network/FriendsActivitySheet';

interface FriendsNetworkSectionProps {
  className?: string;
}

const FriendsNetworkSection: React.FC<FriendsNetworkSectionProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const { user } = useSupabaseSession();
  
  const { data: friendsData, isLoading } = useFriendsCourses(user?.id, '30d');

  const processedData = useMemo(() => {
    if (!friendsData?.recent) return null;

    const courseMap = new Map<string, any>();
    const uniqueFriends = new Set<string>();

    for (const hit of friendsData.recent) {
      if (!hit.course_id) continue;
      uniqueFriends.add(hit.friend_id);
      
      const existing = courseMap.get(hit.course_id);
      if (!existing) {
        courseMap.set(hit.course_id, {
          course_id: hit.course_id,
          course_name: hit.course_name,
          country: hit.course_country,
          thumbnail_url: hit.thumbnail_url,
          community_rating: hit.community_rating,
          friends: [hit],
          total_friends_played: 1,
          most_recent_play: hit.played_at,
        });
      } else {
        existing.friends.push(hit);
        existing.total_friends_played = existing.friends.length;
        if (new Date(hit.played_at) > new Date(existing.most_recent_play)) {
          existing.most_recent_play = hit.played_at;
        }
      }
    }

    const courses = Array.from(courseMap.values())
      .sort((a, b) => b.total_friends_played - a.total_friends_played);

    const trendingCourse = courses[0] || null;

    const recentFriends = friendsData.recent
      .reduce((acc: any[], hit) => {
        if (!acc.find(f => f.friend_id === hit.friend_id)) {
          acc.push({
            friend_id: hit.friend_id,
            display_name: hit.friend_profile.display_name || hit.friend_profile.username,
            avatar_url: hit.friend_profile.profile_photo_url,
            recent_course: hit.course_name,
          });
        }
        return acc;
      }, [])
      .slice(0, 5);

    return {
      totalFriendsActive: uniqueFriends.size,
      totalCourses: courses.length,
      totalRounds: friendsData.recent.length,
      trendingCourse,
      recentFriends,
    };
  }, [friendsData]);

  if (!user) return null;
  if (isLoading) return null;
  if (!processedData || processedData.totalFriendsActive === 0) return null;

  const { totalFriendsActive, totalCourses, totalRounds, trendingCourse, recentFriends } = processedData;

  const handleViewNetwork = () => {
    setActivitySheetOpen(true);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };




  return (
    <>
    <section className={`mb-4 ${className}`}>
      {/* Header row */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Your Network</h2>
        </div>
        <button
          onClick={handleViewNetwork}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats row - NO CARD, directly on bg */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Stacked friend avatars - Squircle shape matching header */}
          <div className="flex -space-x-2">
            {recentFriends.slice(0, 4).map((friend: any, idx: number) => (
              <div 
                key={friend.friend_id} 
                className="relative"
                style={{ zIndex: 4 - idx }}
              >
                <SquircleAvatar
                  size={32}
                  src={friend.avatar_url}
                  alt={friend.display_name}
                  userId={friend.friend_id}
                  hideRing
                  className="ring-2 ring-[#f8fafc]"
                />
              </div>
            ))}
            {totalFriendsActive > 4 && (
              <div 
                className="flex items-center justify-center bg-muted ring-2 ring-[#f8fafc]"
                style={{
                  width: '32px',
                  aspectRatio: '1 / 1.05',
                  borderRadius: '34%',
                }}
              >
                <span className="text-xs font-medium text-muted-foreground">+{totalFriendsActive - 4}</span>
              </div>
            )}
          </div>
          
          {/* Inline stats text */}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalFriendsActive}</span> friend{totalFriendsActive === 1 ? '' : 's'} · 
            <span className="font-medium text-foreground"> {totalRounds}</span> round{totalRounds === 1 ? '' : 's'} · 
            <span className="font-medium text-foreground"> {totalCourses}</span> course{totalCourses === 1 ? '' : 's'}
          </p>
        </div>
        
        {/* Time badge - subtle text */}
        <span className="text-xs text-muted-foreground/60">
          Last 30 days
        </span>
      </div>

      {/* Trending Course - ONLY card element */}
      {trendingCourse && (
        <div className="px-4">
          <button
            onClick={() => handleCourseClick(trendingCourse.course_id)}
            className="w-full bg-card rounded-xl overflow-hidden shadow-sm border border-border/60 hover:border-border hover:shadow transition-all text-left"
          >
            <div className="flex">
              <div className="relative w-24 h-20 flex-shrink-0">
                {trendingCourse.thumbnail_url ? (
                  <img 
                    src={trendingCourse.thumbnail_url} 
                    alt={trendingCourse.course_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <span className="text-2xl">⛳</span>
                  </div>
                )}
                <div className="absolute top-1 left-1">
                  <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    Hot
                  </span>
                </div>
              </div>

              <div className="flex-1 p-3 flex flex-col justify-center">
                <p className="font-medium text-foreground text-sm truncate">
                  {trendingCourse.course_name}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {trendingCourse.country}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex -space-x-1">
                    {trendingCourse.friends.slice(0, 3).map((friend: any, idx: number) => (
                      <div 
                        key={friend.friend_id} 
                        className="relative"
                        style={{ zIndex: 3 - idx }}
                      >
                        <SquircleAvatar
                          size={20}
                          src={friend.friend_profile.profile_photo_url}
                          alt={friend.friend_profile.display_name || friend.friend_profile.username}
                          userId={friend.friend_id}
                          hideRing
                          thinRing
                          className="ring-1 ring-card"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {trendingCourse.total_friends_played} friend{trendingCourse.total_friends_played === 1 ? '' : 's'} played
                  </span>
                </div>
              </div>

              <div className="flex items-center pr-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        </div>
      )}
    </section>
    <FriendsActivitySheet open={activitySheetOpen} onOpenChange={setActivitySheetOpen} />
    </>
  );
};

export default FriendsNetworkSection;
