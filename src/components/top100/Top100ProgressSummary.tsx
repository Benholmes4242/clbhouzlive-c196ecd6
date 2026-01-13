import React from 'react';
import { AnimatedNumber, AnimatedProgressBar } from '@/components/ui/motion';

type Props = {
  ratedCount: number;
  listCount: number;
  /** Actual total courses across all lists the user has progress in */
  totalCourses?: number;
};

export function Top100ProgressSummary({ ratedCount, listCount, totalCourses }: Props) {
  // Use actual totals if provided, otherwise estimate based on list count
  const totalCoursesPossible = totalCourses ?? listCount * 100;
  const progressPercent =
    totalCoursesPossible > 0
      ? Math.min(100, (ratedCount / totalCoursesPossible) * 100)
      : 0;

  return (
    <section className="my-4 flex flex-col items-center text-center gap-2 px-4">
      {/* Headline - clear hierarchy with animated number */}
      <p className="text-sm font-medium text-foreground">
        You've rated{' '}
        <AnimatedNumber value={ratedCount} minCh={1} className="font-semibold" />
        {' '}course{ratedCount === 1 ? '' : 's'} across{' '}
        <AnimatedNumber value={listCount} minCh={1} className="font-semibold" delay={0.05} />
        {' '}Top 100 list{listCount === 1 ? '' : 's'}
      </p>

      {/* Secondary line - muted detail */}
      <p className="text-xs text-muted-foreground tabular-nums">
        <AnimatedNumber value={ratedCount} minCh={1} delay={0.1} /> / {totalCoursesPossible} courses ·{' '}
        <AnimatedNumber value={Math.round(progressPercent)} minCh={1} suffix="%" delay={0.15} />
      </p>

      {/* Progress bar - animated fill */}
      <div className="w-full max-w-[400px]">
        <AnimatedProgressBar 
          percentage={progressPercent}
          height="h-2"
          bgColor="bg-muted/80"
          fillColor="bg-[hsl(var(--tab-orange))]"
          delay={0.2}
        />
      </div>
    </section>
  );
}