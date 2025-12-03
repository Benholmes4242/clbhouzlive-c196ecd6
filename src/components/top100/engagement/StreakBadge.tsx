import React from 'react';
import { useStreaks } from '@/hooks/useStreaks';
import { cn } from '@/lib/utils';
import { Flame, Target } from 'lucide-react';

interface StreakBadgeProps {
  userId?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export function StreakBadge({ userId, variant = 'full', className }: StreakBadgeProps) {
  const { data: streakData, isLoading } = useStreaks(userId);

  if (isLoading || !streakData) return null;

  const { dailyStreak, isActive } = streakData;

  if (dailyStreak === 0 && !isActive) return null;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
          isActive
            ? 'bg-orange-100 text-orange-700'
            : 'bg-slate-100 text-slate-500',
          className
        )}
      >
        <Flame className={cn('w-3 h-3', isActive && 'text-orange-500')} />
        {dailyStreak}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2 flex items-center justify-between gap-3',
        isActive
          ? 'bg-orange-50/80 border-orange-200'
          : 'bg-slate-50 border-slate-200',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isActive ? 'bg-orange-100' : 'bg-slate-100'
          )}
        >
          <Flame
            className={cn(
              'w-4 h-4',
              isActive ? 'text-orange-500' : 'text-slate-400'
            )}
          />
        </div>
        <div>
          <span
            className={cn(
              'text-sm font-semibold',
              isActive ? 'text-orange-700' : 'text-slate-600'
            )}
          >
            {dailyStreak}-day streak
          </span>
          <p className="text-[11px] text-muted-foreground">
            {isActive
              ? 'Keep it going!'
              : 'Rate a course to restart'}
          </p>
        </div>
      </div>
      
      {streakData.nextReward && (
        <div className="text-right">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>{streakData.nextReward.at - dailyStreak} to next reward</span>
          </div>
        </div>
      )}
    </div>
  );
}
