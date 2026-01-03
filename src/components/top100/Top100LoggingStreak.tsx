import React, { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, isSameMonth } from 'date-fns';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Round {
  played_at: string;
  [key: string]: any;
}

interface Top100LoggingStreakProps {
  rounds: Round[];
  onLogRound?: () => void;
}

export const Top100LoggingStreak: React.FC<Top100LoggingStreakProps> = ({
  rounds,
  onLogRound,
}) => {
  const { currentStreak, hasLoggedThisMonth, streakActive } = useMemo(() => {
    const now = new Date();
    let streak = 0;
    let checkMonth = now;
    let hasThisMonth = false;

    // Check if logged this month
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    hasThisMonth = rounds.some((r) => {
      const playedDate = new Date(r.played_at);
      return isWithinInterval(playedDate, { start: thisMonthStart, end: thisMonthEnd });
    });

    // Count consecutive months with logs (including current if applicable)
    for (let i = 0; i < 24; i++) {
      const monthStart = startOfMonth(checkMonth);
      const monthEnd = endOfMonth(checkMonth);
      
      const hasLogThisMonth = rounds.some((r) => {
        const playedDate = new Date(r.played_at);
        return isWithinInterval(playedDate, { start: monthStart, end: monthEnd });
      });

      if (hasLogThisMonth) {
        streak++;
        checkMonth = subMonths(checkMonth, 1);
      } else {
        // If it's the current month and no log, check if previous months had streak
        if (i === 0 && !hasLogThisMonth) {
          checkMonth = subMonths(checkMonth, 1);
          continue;
        }
        break;
      }
    }

    // If no log this month but had previous streak, we're "at risk"
    const active = hasThisMonth || streak > 0;

    return {
      currentStreak: hasThisMonth ? streak : Math.max(0, streak),
      hasLoggedThisMonth: hasThisMonth,
      streakActive: active,
    };
  }, [rounds]);

  const currentMonth = format(new Date(), 'MMMM');

  return (
    <div className="bg-card border border-border/60 rounded-xl p-4">
      <div className="flex items-center justify-between">
        {/* Streak display */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              currentStreak > 0
                ? 'bg-orange-500/12 text-orange-500'  // Slightly less saturated bg (item 4)
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currentStreak > 0 ? (
                <>
                  {currentStreak} month{currentStreak !== 1 ? 's' : ''} streak
                </>
              ) : (
                'Start a streak'
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasLoggedThisMonth ? (
                `You've logged in ${currentMonth} – keep it up!`
              ) : currentStreak > 0 ? (
                `Log one in ${currentMonth} to continue.`
              ) : (
                `Log a Top 100 round to start.`
              )}
            </p>
          </div>
        </div>

        {/* CTA if needed */}
        {!hasLoggedThisMonth && onLogRound && (
          <button
            type="button"
            onClick={onLogRound}
            className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
          >
            Log now
          </button>
        )}
      </div>

      {/* Visual month indicators (last 6 months) */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
        {Array.from({ length: 6 }).map((_, idx) => {
          const monthDate = subMonths(new Date(), 5 - idx);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const hasLog = rounds.some((r) => {
            const playedDate = new Date(r.played_at);
            return isWithinInterval(playedDate, { start: monthStart, end: monthEnd });
          });
          const isCurrent = isSameMonth(monthDate, new Date());

          return (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all',
                  hasLog
                    ? 'bg-orange-500/20 text-orange-600 shadow-[0_0_6px_rgba(249,115,22,0.25)]'  // Glow for streak months (item 4)
                    : isCurrent
                    ? 'bg-muted border-2 border-dashed border-muted-foreground/50 text-muted-foreground'  // Thicker current ring (item 4)
                    : 'bg-muted/50 text-muted-foreground/60'
                )}
              >
                {hasLog ? '✓' : ''}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {format(monthDate, 'MMM')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
