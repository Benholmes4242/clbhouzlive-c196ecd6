import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { toast } from 'sonner';
import { type Timeframe } from '@/lib/timeWindow';

import NetworkChallengePrompt from './friends/NetworkChallengePrompt';
import FriendsHeroCourseCard from './friends/FriendsHeroCourseCard';
import FriendsActivityCard from './friends/FriendsActivityCard';
import FriendsActivityFeed from './friends/FriendsActivityFeed';
import FriendsCoursesSkeleton from './friends/FriendsCoursesSkeleton';
import FriendsCoursesEmpty from './friends/FriendsCoursesEmpty';
import type { CourseWithFriends, FriendCourseHit } from '@/hooks/useFriendsCourses';

const FriendsCoursesPanel: React.FC = () => {
  const { user } = useSupabaseSession();
  const [timeframe, setTimeframe] = useState<Timeframe>('90d');
  const [showTfPicker, setShowTfPicker] = useState(false);

  const { data: realData, isLoading: isRealLoading, isError, error } = useFriendsCourses(user?.id, timeframe);
  const sourceData = realData;
  const isLoading = isRealLoading;

  useEffect(() => {
    if (isError && error) {
      console.error('[FriendsCoursesPanel] Failed to load friends courses', { userId: user?.id, timeframe, error });
      toast.error("Couldn't load Friends' Courses. Please try again.");
    }
  }, [isError, error, user?.id, timeframe]);

  const { data: userPlayedCourseIds } = useQuery({
    queryKey: ['user-played-course-ids-from-ratings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.course_id));
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredData = useMemo(() => {
    if (!sourceData) return null;
    const courseMap = new Map<string, CourseWithFriends>();
    for (const hit of sourceData.recent) {
      if (!hit.course_id) continue;
      const existing = courseMap.get(hit.course_id);
      if (!existing) {
        courseMap.set(hit.course_id, {
          course_id: hit.course_id,
          course_name: hit.course_name,
          country: hit.course_country,
          sub_country: hit.course_sub_country,
          thumbnail_url: hit.thumbnail_url,
          community_rating: hit.community_rating ?? null,
          top100_memberships: hit.top100_memberships,
          friends: [hit],
          most_recent_play: hit.played_at,
          total_friends_played: 1,
        });
      } else {
        existing.friends.push(hit);
        existing.total_friends_played = existing.friends.length;
        if (new Date(hit.played_at) > new Date(existing.most_recent_play)) {
          existing.most_recent_play = hit.played_at;
        }
      }
    }

    const filteredCourses = Array.from(courseMap.values()).sort((a, b) => {
      if (b.total_friends_played !== a.total_friends_played) return b.total_friends_played - a.total_friends_played;
      return new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime();
    });

    const uniqueFriends = new Set(sourceData.recent.map(hit => hit.friend_id));
    return {
      courses: filteredCourses,
      recent: sourceData.recent,
      totalCourses: filteredCourses.length,
      totalFriendsActive: uniqueFriends.size,
    };
  }, [sourceData]);

  const courses = filteredData?.courses || [];
  const recent = filteredData?.recent || [];
  const totalCourses = filteredData?.totalCourses || 0;

  const averageRating = useMemo(() => {
    const ratings = courses.map(c => c.community_rating).filter((r): r is number => r != null);
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }, [courses]);

  const totalRounds = recent.length;

  const userPlayedCount = useMemo(() => {
    if (!userPlayedCourseIds || courses.length === 0) return 0;
    return courses.filter(c => userPlayedCourseIds.has(c.course_id)).length;
  }, [courses, userPlayedCourseIds]);

  const leaderboard = useMemo(() => {
    const friendMap = new Map<string, {
      friendId: string; friendName: string; avatarUrl: string | null; roundCount: number; lastPlayedAt: string;
    }>();
    recent.forEach(hit => {
      const existing = friendMap.get(hit.friend_id);
      const name = hit.friend_profile.display_name || hit.friend_profile.username;
      if (!existing) {
        friendMap.set(hit.friend_id, {
          friendId: hit.friend_id, friendName: name,
          avatarUrl: hit.friend_profile.profile_photo_url, roundCount: 1, lastPlayedAt: hit.played_at,
        });
      } else {
        existing.roundCount++;
        if (new Date(hit.played_at) > new Date(existing.lastPlayedAt)) existing.lastPlayedAt = hit.played_at;
      }
    });
    return Array.from(friendMap.values()).sort((a, b) => {
      if (b.roundCount !== a.roundCount) return b.roundCount - a.roundCount;
      return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
    });
  }, [recent]);

  const heroCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return [...courses].sort((a, b) => b.total_friends_played - a.total_friends_played)[0];
  }, [courses]);

  const trendingCourseIds = useMemo(() => {
    return new Set(courses.filter(c => c.total_friends_played >= 2).map(c => c.course_id));
  }, [courses]);

  const hasFriends = sourceData?.hasFriends ?? false;

  if (!user) return null;
  if (isLoading && !filteredData) return <FriendsCoursesSkeleton />;
  if (!hasFriends && !isLoading) return <FriendsCoursesEmpty />;

  return (
    <div style={{ background: '#F8FAFC' }} onClick={() => setShowTfPicker(false)}>

      {/* ── SLATE MASTHEAD ── */}
      <div style={{ background: '#0F172A', padding: '16px 16px 0' }}>
        {/* Eyebrow */}
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
          ⚡ CLBHOUZ · YOUR NETWORK
        </div>

        {/* Headline + timeframe picker row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
              Friends Activity
            </h1>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>
              {totalRounds} rounds · {totalCourses} courses{averageRating != null ? ` · ${averageRating.toFixed(1)} avg rating` : ''}
            </div>
          </div>

          {/* Timeframe pill + dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowTfPicker(!showTfPicker)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                {({ '7d': '7 days', '30d': '30 days', '90d': '90 days', '12m': '12 months', 'all': 'All time' } as Record<string,string>)[timeframe]}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>▾</span>
            </button>
            {showTfPicker && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', borderRadius: '10px', overflow: 'hidden', zIndex: 50, minWidth: '140px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                {(['7d','30d','90d','12m','all'] as Timeframe[]).map((tf) => {
                  const label = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '12m': '12 months', 'all': 'All time' }[tf];
                  return (
                    <button key={tf} onClick={() => { setTimeframe(tf); setShowTfPicker(false); }}
                      style={{ width: '100%', padding: '9px 14px', textAlign: 'left' as const, background: tf === timeframe ? 'rgba(247,147,30,0.06)' : 'transparent', borderLeft: tf === timeframe ? '3px solid #F7931E' : '3px solid transparent', borderTop: 'none', borderRight: 'none', borderBottom: '0.5px solid rgba(15,23,42,0.07)', fontSize: '13px', fontWeight: tf === timeframe ? 800 : 500, color: tf === timeframe ? '#0F172A' : '#64748B', cursor: 'pointer', display: 'block' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4-col stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          {([
            { l: 'ROUNDS',     v: String(totalRounds) },
            { l: 'COURSES',    v: String(totalCourses) },
            { l: 'AVG RATING', v: averageRating != null ? averageRating.toFixed(1) : '—', amber: true },
            { l: 'FRIENDS',    v: String(filteredData?.totalFriendsActive || 0) },
          ] as { l: string; v: string; amber?: boolean }[]).map((s, i) => (
            <div key={s.l} style={{ padding: '9px 0 11px', textAlign: 'center' as const, borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: '9.5px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>{s.l}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: s.amber ? '#F7931E' : '#ffffff' }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STICKY HEADER ── */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(15,23,42,0.07)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '9px 20px', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(15,23,42,0.5)', fontWeight: 500 }}>‹ Discover</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '9.5px', color: '#CBD5E1', fontWeight: 600 }}>Your Network</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {totalCourses === 0 && !isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' as const }}>
            <span style={{ fontSize: '32px', marginBottom: '12px' }}>📅</span>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>No activity in this period</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Try expanding your time range</p>
          </div>
        ) : (
          <>
            <NetworkChallengePrompt userPlayedCount={userPlayedCount} totalCourses={totalCourses} />
            {heroCourse && <FriendsHeroCourseCard course={heroCourse} filterType="all" />}
            <FriendsActivityCard leaderboard={leaderboard} timeframe={timeframe} />
            <FriendsActivityFeed
              recent={recent}
              courses={heroCourse ? courses.filter(c => c.course_id !== heroCourse.course_id) : courses}
              trendingCourseIds={trendingCourseIds}
              userPlayedCourseIds={userPlayedCourseIds}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsCoursesPanel;
