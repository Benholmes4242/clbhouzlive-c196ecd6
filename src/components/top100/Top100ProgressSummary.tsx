/**
 * Top100ProgressSummary - Premium summary stats with animated numbers and progress bar
 * Features season-colored key numbers, animated progress bar with shimmer effect
 */

import React from 'react';
import { AnimatedNumber, AnimatedProgressBar } from '@/components/ui/motion';
import { cn } from '@/lib/utils';

// Season color - Pre-Season mint (matches Top100ProgressHero)
const SEASON_COLOR = '#3EBD93';

type Props = {
  ratedCount: number;
  listCount: number;
  /** Actual total courses across all lists the user has progress in */
  totalCourses?: number;
  /** Loading state for skeleton display */
  isLoading?: boolean;
};

export function Top100ProgressSummary({ ratedCount, listCount, totalCourses, isLoading }: Props) {
  // Use actual totals if provided, otherwise estimate based on list count
  const totalCoursesPossible = totalCourses ?? listCount * 100;
  const progressPercent =
    totalCoursesPossible > 0
      ? Math.min(100, (ratedCount / totalCoursesPossible) * 100)
      : 0;

  if (isLoading) {
    return (
      <section className="my-4 flex flex-col items-center text-center gap-2 px-4">
        <div className="h-5 w-72 rounded-full clb-skeleton" />
        <div className="h-4 w-48 rounded-full clb-skeleton" />
        <div className="w-full max-w-[400px] mt-1">
          <div className="h-2.5 w-full rounded-full clb-skeleton" />
        </div>
      </section>
    );
  }

  return (
    <section className="my-4 flex flex-col items-center text-center gap-2.5 px-4 animate-fade-in">
      {/* Headline - season-colored key numbers */}
      <p className="text-sm font-medium text-foreground">
        You've rated{' '}
        <span style={{ color: SEASON_COLOR }}>
          <AnimatedNumber
            value={ratedCount}
            minCh={1}
            className="font-bold text-[20px] leading-none align-baseline"
          />
        </span>
        {' '}course{ratedCount === 1 ? '' : 's'} across{' '}
        <span style={{ color: SEASON_COLOR }}>
          <AnimatedNumber
            value={listCount}
            minCh={1}
            className="font-bold text-[20px] leading-none align-baseline"
            delay={0.05}
          />
        </span>
        {' '}Top 100 list{listCount === 1 ? '' : 's'}
      </p>

      {/* Secondary line - season-colored numerator, muted denominator */}
      <p className="text-xs text-muted-foreground tabular-nums">
        <span style={{ color: SEASON_COLOR }}>
          <AnimatedNumber
            value={ratedCount}
            minCh={1}
            delay={0.1}
            className="font-bold"
          />
        </span>{' '}
        <span className="text-muted-foreground">/ {totalCoursesPossible} courses</span>{' '}
        <span className="text-muted-foreground">
          · <AnimatedNumber value={Math.round(progressPercent)} minCh={1} suffix="%" delay={0.15} />
        </span>
      </p>

      {/* Progress bar - season color with shimmer animation */}
      <div className="w-full max-w-[400px] relative">
        <div className="relative h-[6px] bg-muted/60 dark:bg-muted rounded-full overflow-hidden">
          {/* Glow effect behind progress */}
          <div
            className="absolute inset-0 rounded-full blur-md opacity-40"
            style={{
              background: SEASON_COLOR,
              width: `${progressPercent}%`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          {/* Main progress bar with season color + shimmer */}
          <div
            className="absolute inset-y-0 left-0 rounded-full z-10 overflow-hidden"
            style={{
              width: `${progressPercent}%`,
              background: SEASON_COLOR,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'shimmer 2.5s ease-in-out infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  );
}
