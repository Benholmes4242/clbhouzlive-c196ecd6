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
  isOwnProfile?: boolean;
  firstName?: string;
}

export const Top100LoggingStreak: React.FC<Top100LoggingStreakProps> = ({
  rounds,
  isOwnProfile = true,
  firstName,
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
    // Inline section - no card wrapper
    <section>
      <div className="flex items-center justify-between">
        {/* Streak display */}
        <div className="flex items-center gap-3">
          {/* Fire icon with orange/amber color */}
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              currentStreak > 0
                ? 'bg-gradient-to-br from-orange-500/15 to-amber-500/15 text-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Flame className={cn(
              "h-4.5 w-4.5 transition-transform",
              currentStreak > 0 && "animate-[pulse_2s_ease-in-out_infinite]"
            )} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currentStreak > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="tabular-nums">{currentStreak}</span>
                  <span>month{currentStreak !== 1 ? 's' : ''} streak</span>
                </span>
              ) : (
                'Start a streak'
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasLoggedThisMonth ? (
                isOwnProfile 
                  ? `You've logged in ${currentMonth} – keep it up!`
                  : `${firstName || 'They'} has logged in ${currentMonth}!`
              ) : currentStreak > 0 ? (
                isOwnProfile
                  ? `Log one in ${currentMonth} to continue.`
                  : `${firstName || 'They'} needs to log one in ${currentMonth} to continue.`
              ) : (
                isOwnProfile
                  ? `Log a Top 100 round to start.`
                  : `${firstName || 'They'} hasn't started a streak yet.`
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
      <div className="flex items-center gap-1.5 mt-3" role="list" aria-label="Monthly activity indicators">
        {Array.from({ length: 6 }).map((_, idx) => {
          const monthDate = subMonths(new Date(), 5 - idx);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const hasLog = rounds.some((r) => {
            const playedDate = new Date(r.played_at);
            return isWithinInterval(playedDate, { start: monthStart, end: monthEnd });
          });
          const isCurrent = isSameMonth(monthDate, new Date());
          const monthName = format(monthDate, 'MMMM');

          return (
            <div 
              key={idx} 
              className="flex flex-col items-center gap-1 flex-1"
              role="listitem"
              aria-label={`${monthName}: ${hasLog ? 'Round logged' : 'No activity'}`}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all',
                  hasLog
                    ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                    : isCurrent
                    ? 'bg-muted/80 border-2 border-dashed border-primary/40 text-muted-foreground animate-[pulse_3s_ease-in-out_infinite]'
                    : 'bg-muted/40 text-muted-foreground/50 border border-dashed border-muted-foreground/20'
                )}
                aria-hidden="true"
              >
                {hasLog ? (
                  <span className="text-emerald-600">✓</span>
                ) : null}
              </div>
              <span 
                className={cn(
                  "text-[9px] transition-colors",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {format(monthDate, 'MMM')}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
