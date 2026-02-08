/**
 * Top100ProgressSummary - Premium summary stats with animated numbers and progress bar
 * Features gradient-filled progress bar with glow effect and smooth animations
 */

import React from 'react';
import { AnimatedNumber, AnimatedProgressBar } from '@/components/ui/motion';
import { cn } from '@/lib/utils';

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
      {/* Headline - clear hierarchy with animated number */}
      <p className="text-sm font-medium text-foreground">
        You've rated{' '}
        <AnimatedNumber value={ratedCount} minCh={1} className="font-bold text-foreground" />
        {' '}course{ratedCount === 1 ? '' : 's'} across{' '}
        <AnimatedNumber value={listCount} minCh={1} className="font-bold text-foreground" delay={0.05} />
        {' '}Top 100 list{listCount === 1 ? '' : 's'}
      </p>

      {/* Secondary line - muted detail */}
      <p className="text-xs text-muted-foreground tabular-nums">
        <AnimatedNumber value={ratedCount} minCh={1} delay={0.1} /> / {totalCoursesPossible} courses ·{' '}
        <AnimatedNumber value={Math.round(progressPercent)} minCh={1} suffix="%" delay={0.15} />
      </p>

      {/* Progress bar - animated fill with gradient and glow */}
      <div className="w-full max-w-[400px] relative">
        <div className="relative h-2.5 bg-muted/60 dark:bg-muted rounded-full overflow-hidden">
          {/* Glow effect behind progress */}
          <div 
            className="absolute inset-0 rounded-full blur-md opacity-40"
            style={{
              background: `linear-gradient(90deg, hsl(var(--tab-orange)), hsl(38, 95%, 60%))`,
              width: `${progressPercent}%`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          {/* Main progress bar with gradient */}
          <AnimatedProgressBar 
            percentage={progressPercent}
            height="h-2.5"
            bgColor="bg-transparent"
            fillColor="bg-gradient-to-r from-[hsl(var(--tab-orange))] to-amber-400"
            delay={0.2}
            className="relative z-10"
          />
        </div>
      </div>
    </section>
  );
}
