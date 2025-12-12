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
    <section className="my-5 flex flex-col items-center text-center gap-2.5 px-4">
      <p className="text-sm font-normal text-muted-foreground">
        You've rated {ratedCount} course{ratedCount === 1 ? '' : 's'} across {listCount} Top 100 list{listCount === 1 ? '' : 's'}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
        <span>{ratedCount} / {totalCoursesPossible} courses</span>
        <span className="font-medium">{Math.round(progressPercent)}%</span>
      </div>

      <div className="h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-amber-500 transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}
