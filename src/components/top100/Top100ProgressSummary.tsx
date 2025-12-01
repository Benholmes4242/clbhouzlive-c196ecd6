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
    <section className="mt-4 flex flex-col items-center text-center gap-2 px-4">
      <p className="text-sm text-slate-700">
        You&apos;ve rated {ratedCount} course{ratedCount === 1 ? '' : 's'} across {listCount} Top 100 list{listCount === 1 ? '' : 's'}
      </p>

      <p className="text-xs text-slate-500">
        {ratedCount} / {totalCoursesPossible} courses
      </p>

      <div className="mt-1 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}
