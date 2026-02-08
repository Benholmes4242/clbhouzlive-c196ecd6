import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { FriendCourseHit, CourseWithFriends } from '@/hooks/useFriendsCourses';
import type { Timeframe } from '@/lib/timeWindow';
import { getTimeWindow } from '@/lib/timeWindow';

interface WeeklyRecapCardProps {
  recent: FriendCourseHit[];
  courses: CourseWithFriends[];
  timeframe: Timeframe;
  leaderboard: {
    friendId: string;
    friendName: string;
    avatarUrl: string | null;
    roundCount: number;
    lastPlayedAt: string;
  }[];
}

const WeeklyRecapCard: React.FC<WeeklyRecapCardProps> = ({ recent, courses, timeframe, leaderboard }) => {
  const navigate = useNavigate();
  
  // Use the shared time window utility for consistent label
  const { label: periodLabel } = getTimeWindow(timeframe);

  // All stats are computed from the already-filtered `recent` prop
  const totalRounds = recent.length;

  // Unique courses played in this period
  const uniqueCourses = new Set(recent.map((r) => r.course_id)).size;

  // Most active friend in this period
  const friendActivityMap = new Map<string, number>();
  recent.forEach((hit) => {
    friendActivityMap.set(hit.friend_id, (friendActivityMap.get(hit.friend_id) || 0) + 1);
  });

  let mostActiveFriend: { name: string; username: string; avatarUrl: string | null; rounds: number } | null = null;
  let maxRounds = 0;
  friendActivityMap.forEach((count, friendId) => {
    if (count > maxRounds) {
      maxRounds = count;
      const friend = recent.find((r) => r.friend_id === friendId);
      if (friend) {
        mostActiveFriend = {
          name: friend.friend_profile.display_name || friend.friend_profile.username,
          username: friend.friend_profile.username,
          avatarUrl: friend.friend_profile.profile_photo_url,
          rounds: count,
        };
      }
    }
  });

  // Top course this period (most plays)
  const coursePlayMap = new Map<string, { id: string; name: string; count: number }>();
  recent.forEach((hit) => {
    const existing = coursePlayMap.get(hit.course_id);
    if (!existing) {
      coursePlayMap.set(hit.course_id, { id: hit.course_id, name: hit.course_name, count: 1 });
    } else {
      existing.count++;
    }
  });

  let topCourse: { id: string; name: string; friendCount: number } | null = null;
  let maxPlays = 0;
  coursePlayMap.forEach((data) => {
    if (data.count > maxPlays) {
      maxPlays = data.count;
      topCourse = { id: data.id, name: data.name, friendCount: data.count };
    }
  });

  // Don't render if no activity in this period
  if (totalRounds === 0) {
    return null;
  }

  const handleFriendClick = () => {
    if (mostActiveFriend) {
      navigate(`/user/${mostActiveFriend.username}`);
    }
  };

  const handleCourseClick = () => {
    if (topCourse) {
      navigate(`/courses/${topCourse.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-xl overflow-hidden border border-border/60 shadow-sm bg-gradient-to-br from-primary/[0.04] to-primary/[0.02]"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50/80 border border-emerald-200/60">
            <Calendar className="w-3 h-3 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Activity in your network</h3>
            <p className="text-[11px] text-muted-foreground">{periodLabel}</p>
          </div>
        </div>
      </div>

      {/* Stats Row - Compact horizontal */}
      <div className="px-4 py-3 flex items-center justify-center gap-8 border-b border-border/40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.25 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-foreground tabular-nums">{totalRounds}</p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/75">
            Rounds
          </p>
        </motion.div>
        <div className="h-6 w-px bg-border/60" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-foreground tabular-nums">{uniqueCourses}</p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/75">
            Courses
          </p>
        </motion.div>
      </div>

      {/* Bottom highlights - 2 compact rows */}
      <div className="px-4 py-2.5 space-y-1.5">
        {/* Most active friend - tappable */}
        {mostActiveFriend && (
          <button
            onClick={handleFriendClick}
            className="w-full flex items-center gap-2 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/60 active:scale-[0.97] transition-all text-left"
          >
            <Squircle width={20} height={20} className="shrink-0">
              <img
                src={mostActiveFriend.avatarUrl || '/placeholder.svg'}
                alt={`${mostActiveFriend.name}'s profile`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </Squircle>
            <p className="text-xs text-muted-foreground">
              Most active:{' '}
              <span className="font-semibold text-foreground hover:underline">{mostActiveFriend.name}</span>
              <span className="text-muted-foreground"> · {mostActiveFriend.rounds} rounds</span>
            </p>
          </button>
        )}

        {/* Top course - tappable */}
        {topCourse && topCourse.friendCount >= 2 && (
          <button
            onClick={handleCourseClick}
            className="w-full flex items-center gap-2 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/60 active:scale-[0.97] transition-all text-left"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-50/60 border border-amber-200/40">
              <TrendingUp className="w-2.5 h-2.5 text-amber-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              Top course:{' '}
              <span className="font-semibold text-foreground hover:underline">{topCourse.name}</span>
              <span className="text-muted-foreground"> · played by {topCourse.friendCount}</span>
            </p>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default WeeklyRecapCard;
