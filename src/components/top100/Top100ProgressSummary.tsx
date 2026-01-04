import React from 'react';

type Props = {
  ratedCount: number;
  listCount: number;
};

export function Top100ProgressSummary({ ratedCount, listCount }: Props) {
  const totalCoursesPossible = listCount * 100;
  const progressPercent =
    totalCoursesPossible > 0
      ? Math.min(100, (ratedCount / totalCoursesPossible) * 100)
      : 0;

  return (
    <section className="my-4 flex flex-col items-center text-center gap-2 px-4">
      {/* Headline - clear hierarchy */}
      <p className="text-sm font-medium text-foreground">
        You've rated {ratedCount} course{ratedCount === 1 ? '' : 's'} across {listCount} Top 100 list{listCount === 1 ? '' : 's'}
      </p>

      {/* Secondary line - muted detail */}
      <p className="text-xs text-muted-foreground">
        {ratedCount} / {totalCoursesPossible} courses · {Math.round(progressPercent)}%
      </p>

      {/* Progress bar - thicker, more presence */}
      <div className="h-2 w-full max-w-[400px] overflow-hidden rounded-full bg-muted/80">
        <div
          className="h-full rounded-full bg-[hsl(var(--tab-orange))] transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}
