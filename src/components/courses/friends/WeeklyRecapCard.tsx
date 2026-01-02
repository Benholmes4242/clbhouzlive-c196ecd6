import React from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Calendar, TrendingUp } from 'lucide-react';
import type { FriendCourseHit, CourseWithFriends } from '@/hooks/useFriendsCourses';

interface WeeklyRecapCardProps {
  recent: FriendCourseHit[];
  courses: CourseWithFriends[];
  leaderboard: {
    friendId: string;
    friendName: string;
    avatarUrl: string | null;
    roundCount: number;
    lastPlayedAt: string;
  }[];
}

const WeeklyRecapCard: React.FC<WeeklyRecapCardProps> = ({ recent, courses, leaderboard }) => {
  // Calculate weekly stats (last 7 days)
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const weeklyRounds = recent.filter(
    (hit) => new Date(hit.played_at) >= weekAgo
  );

  const totalRoundsThisWeek = weeklyRounds.length;

  // Unique courses played this week
  const uniqueCoursesThisWeek = new Set(weeklyRounds.map((r) => r.course_id)).size;

  // Most active friend this week
  const friendActivityMap = new Map<string, number>();
  weeklyRounds.forEach((hit) => {
    friendActivityMap.set(hit.friend_id, (friendActivityMap.get(hit.friend_id) || 0) + 1);
  });

  let mostActiveFriend: { name: string; avatarUrl: string | null; rounds: number } | null = null;
  let maxRounds = 0;
  friendActivityMap.forEach((count, friendId) => {
    if (count > maxRounds) {
      maxRounds = count;
      const friend = weeklyRounds.find((r) => r.friend_id === friendId);
      if (friend) {
        mostActiveFriend = {
          name: friend.friend_profile.display_name || friend.friend_profile.username,
          avatarUrl: friend.friend_profile.profile_photo_url,
          rounds: count,
        };
      }
    }
  });

  // Top course this week (most plays)
  const coursePlayMap = new Map<string, { name: string; count: number }>();
  weeklyRounds.forEach((hit) => {
    const existing = coursePlayMap.get(hit.course_id);
    if (!existing) {
      coursePlayMap.set(hit.course_id, { name: hit.course_name, count: 1 });
    } else {
      existing.count++;
    }
  });

  let topCourse: { name: string; friendCount: number } | null = null;
  let maxPlays = 0;
  coursePlayMap.forEach((data) => {
    if (data.count > maxPlays) {
      maxPlays = data.count;
      topCourse = { name: data.name, friendCount: data.count };
    }
  });

  // Don't render if no weekly activity
  if (totalRoundsThisWeek === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] border border-border/60 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200/80">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">This week in your network</h3>
            <p className="text-[11px] text-muted-foreground">Activity from the last 7 days</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-4 grid grid-cols-2 gap-4">
        {/* Rounds logged */}
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{totalRoundsThisWeek}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/75 mt-0.5">
            Rounds logged
          </p>
        </div>

        {/* Courses played */}
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{uniqueCoursesThisWeek}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/75 mt-0.5">
            Courses played
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-200/60" />

      {/* Bottom highlights */}
      <div className="px-4 py-3 space-y-2">
        {/* Most active friend */}
        {mostActiveFriend && (
          <div className="flex items-center gap-2">
            <Squircle width={24} height={24} className="shrink-0">
              <img
                src={mostActiveFriend.avatarUrl || '/placeholder.svg'}
                alt={mostActiveFriend.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </Squircle>
            <p className="text-xs text-slate-600">
              Most active:{' '}
              <span className="font-semibold text-foreground">{mostActiveFriend.name}</span>
              <span className="text-slate-400"> ({mostActiveFriend.rounds} rounds)</span>
            </p>
          </div>
        )}

        {/* Top course */}
        {topCourse && topCourse.friendCount >= 2 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-50/80 border border-amber-200/60">
              <TrendingUp className="w-3 h-3 text-amber-600" />
            </div>
            <p className="text-xs text-slate-600">
              Top course:{' '}
              <span className="font-semibold text-foreground">{topCourse.name}</span>
              <span className="text-slate-400"> (played by {topCourse.friendCount} friends)</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WeeklyRecapCard;
