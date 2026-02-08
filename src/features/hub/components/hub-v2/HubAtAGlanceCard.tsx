/**
 * HubAtAGlanceCard - Surface key golf stats in a compact, scannable card
 * Stats: Handicap, Top 100, Streak, Avg Rating
 * Plus next milestone row
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/motion';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

interface HubAtAGlanceCardProps {
  userId: string | undefined;
  handicapIndex: number | null | undefined;
  top100Count: number | null | undefined;
  className?: string;
}

function computeStreak(rounds: { played_at: string }[]): { streak: number; hasLoggedThisMonth: boolean } {
  const now = new Date();
  let streak = 0;
  let checkMonth = now;

  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const hasThisMonth = rounds.some((r) => {
    const playedDate = new Date(r.played_at);
    return isWithinInterval(playedDate, { start: thisMonthStart, end: thisMonthEnd });
  });

  for (let i = 0; i < 24; i++) {
    const monthStart = startOfMonth(checkMonth);
    const monthEnd = endOfMonth(checkMonth);
    const hasLog = rounds.some((r) => {
      const playedDate = new Date(r.played_at);
      return isWithinInterval(playedDate, { start: monthStart, end: monthEnd });
    });

    if (hasLog) {
      streak++;
      checkMonth = subMonths(checkMonth, 1);
    } else {
      if (i === 0 && !hasLog) {
        checkMonth = subMonths(checkMonth, 1);
        continue;
      }
      break;
    }
  }

  return {
    streak: hasThisMonth ? streak : Math.max(0, streak),
    hasLoggedThisMonth: hasThisMonth,
  };
}

export function HubAtAGlanceCard({ userId, handicapIndex, top100Count: top100CountProp, className }: HubAtAGlanceCardProps) {
  const navigate = useNavigate();
  const { data: progressData, isLoading } = useTop100ProgressForUser(userId);

  // Use progress data for top100 count (more accurate than profile prop)
  const top100Count = progressData?.totalTop100Played ?? top100CountProp ?? 0;

  const { streak, hasLoggedThisMonth } = useMemo(() => {
    if (!progressData?.all_rounds_for_streak?.length) return { streak: 0, hasLoggedThisMonth: false };
    return computeStreak(progressData.all_rounds_for_streak);
  }, [progressData?.all_rounds_for_streak]);

  const avgRating = useMemo(() => {
    if (!progressData?.recent_rounds?.length) return null;
    const rated = progressData.recent_rounds.filter(r => r.rating != null && r.rating > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }, [progressData?.recent_rounds]);

  const nextMilestone = progressData?.next_milestone;

  const handleStatTap = useCallback((route: string) => {
    haptic('light');
    navigate(route);
  }, [navigate]);

  const hasAnyData = (handicapIndex != null) || (top100Count != null && top100Count > 0) || streak > 0 || avgRating != null;

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-[18px] border border-border/60 shadow-sm p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty/New user state
  if (!hasAnyData) {
    return (
      <div className={cn("bg-card rounded-[18px] border border-border/60 shadow-sm p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⛳</span>
          <span className="text-[17px] font-semibold text-foreground">At a Glance</span>
        </div>
        <p className="text-[14px] text-muted-foreground mb-3">
          Start your golf journey — log your first round to see your stats here
        </p>
        <button
          onClick={() => handleStatTap('/courses?action=log')}
          className="text-[14px] font-semibold text-primary active:scale-[0.97] transition-transform"
        >
          Log a Round →
        </button>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-[18px] border border-border/60 shadow-sm p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">⛳</span>
          <span className="text-[17px] font-semibold text-foreground">At a Glance</span>
        </div>
        <button
          onClick={() => handleStatTap('/profile')}
          className="text-[13px] font-medium text-muted-foreground active:scale-[0.95] transition-transform flex items-center gap-0.5"
        >
          See all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Handicap */}
        <button
          onClick={() => handleStatTap('/profile')}
          className="flex flex-col items-center gap-0.5 py-2 rounded-xl active:scale-[0.95] active:bg-muted/50 transition-all"
        >
          {handicapIndex != null ? (
            <AnimatedNumber
              value={handicapIndex}
              className="text-xl font-bold text-foreground"
              duration={0.6}
              suffix=""
            />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
          <span className="text-[11px] text-muted-foreground">Handicap</span>
        </button>

        {/* Top 100 */}
        <button
          onClick={() => handleStatTap('/top100')}
          className="flex flex-col items-center gap-0.5 py-2 rounded-xl active:scale-[0.95] active:bg-muted/50 transition-all"
        >
          <AnimatedNumber
            value={top100Count ?? 0}
            className="text-xl font-bold text-foreground"
            duration={0.6}
            delay={0.04}
          />
          <span className="text-[11px] text-muted-foreground">Top 100</span>
        </button>

        {/* Streak */}
        <button
          onClick={() => handleStatTap('/top100?tab=my-progress')}
          className="flex flex-col items-center gap-0.5 py-2 rounded-xl active:scale-[0.95] active:bg-muted/50 transition-all"
        >
          <span className="text-xl font-bold text-foreground inline-flex items-center gap-0.5">
            <AnimatedNumber
              value={streak}
              className="text-xl font-bold text-foreground"
              duration={0.6}
              delay={0.08}
            />
            {streak > 0 && hasLoggedThisMonth && (
              <Flame className="w-4 h-4 text-orange-500" />
            )}
          </span>
          <span className="text-[11px] text-muted-foreground">Streak</span>
        </button>

        {/* Avg Rating */}
        <button
          onClick={() => handleStatTap('/top100')}
          className="flex flex-col items-center gap-0.5 py-2 rounded-xl active:scale-[0.95] active:bg-muted/50 transition-all"
        >
          {avgRating != null ? (
            <AnimatedNumber
              value={avgRating}
              className="text-xl font-bold text-foreground"
              duration={0.6}
              delay={0.12}
            />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
          <span className="text-[11px] text-muted-foreground">Avg</span>
        </button>
      </div>

      {/* Next Milestone Row */}
      {nextMilestone && (
        <>
          <div className="h-px bg-border/60 my-3" />
          <button
            onClick={() => handleStatTap('/achievements')}
            className="w-full flex items-center gap-3 active:scale-[0.98] active:opacity-90 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <span className="flex-1 text-[14px] text-foreground text-left">
              <span className="font-semibold">{nextMilestone.remaining} more</span>
              <span className="text-muted-foreground"> to {nextMilestone.tierName}</span>
            </span>
            <span className="text-[13px] font-medium text-muted-foreground flex items-center gap-0.5">
              View
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
