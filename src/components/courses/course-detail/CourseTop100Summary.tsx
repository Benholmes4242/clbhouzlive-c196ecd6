import React from 'react';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';

interface CourseTop100SummaryProps {
  userId?: string;
}

export function CourseTop100Summary({ userId }: CourseTop100SummaryProps) {
  const { data, isLoading } = useTop100ProgressForUser(userId);

  // TOOD: if loading, show skeleton...
  if (isLoading) {
    return (
      <section className="px-4 pt-4 pb-5 bg-slate-50 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 mx-auto rounded bg-surface-alt" />
          <div className="h-4 w-64 mx-auto rounded bg-surface-alt" />
          <div className="flex justify-center gap-2">
            <div className="h-8 w-24 rounded-full bg-surface-alt" />
            <div className="h-8 w-24 rounded-full bg-surface-alt" />
          </div>
          <div className="h-20 rounded-xl bg-surface-alt" />
          <div className="h-20 rounded-xl bg-surface-alt" />
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="px-4 pt-4 pb-5 bg-slate-50 text-center">
        <p className="text-sm text-muted-foreground">No Top 100 progress data available.</p>
      </section>
    );
  }

  // TOOD: skeletons for missing data
  if (!data || !data.lists || data.lists.length === 0) {
    return (
      <section className="px-4 pt-4 pb-5 bg-slate-50 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 mx-auto rounded bg-surface-alt" />
          <div className="h-4 w-64 mx-auto rounded bg-surface-alt" />
          <div className="flex justify-center gap-2">
            <div className="h-8 w-24 rounded-full bg-surface-alt" />
            <div className="h-8 w-24 rounded-full bg-surface-alt" />
          </div>
          <div className="h-20 rounded-xl bg-surface-alt" />
          <div className="h-20 rounded-xl bg-surface-alt" />
        </div>
      </section>
    );
  }

  const club = getTop100Club(data.total_top100_rated ?? data.total_played_top100);
  const totalRated = data.total_top100_rated ?? data.total_played_top100;
  const regions = data.regions_count;

  // Helper to get a list by slug (we only care about the 4 hero lists)
  const bySlug = (slug: string) =>
    data.lists.find((l) => l.listSlug === slug);

  const listsToShow = [
    bySlug('global'),
    bySlug('gb-i'),
    bySlug('usa'),
    bySlug('europe'),
  ].filter(Boolean);

  return (
    <section className="px-4 pt-4 pb-5 bg-slate-50 text-center">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Your Top 100 Progress
        </h2>
        <p className="text-base text-muted-foreground">
          You've rated {totalRated} Top 100 course{totalRated === 1 ? '' : 's'} across{' '}
          {regions} region{regions === 1 ? '' : 's'}.
        </p>
        
        {/* Club Ring & Milestone Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          {club && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
              <span className={cn(
                "h-4 w-4 rounded-full border border-primary-accent/60 ring-2 ring-offset-[1px] ring-offset-background",
                getTop100RingBorderClass(club.ring)
              )} />
              {club.label}
            </span>
          )}
          
          {data.next_milestone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-sm text-muted-foreground">
              Next milestone: {data.next_milestone.remaining} more{' '}
              {data.next_milestone.remaining === 1 ? 'course' : 'courses'} to{' '}
              {data.next_milestone.label}
            </span>
          )}
        </div>
      </div>

      {/* Mini progress cards for each list */}
      <div className="grid grid-cols-2 gap-3">
        {listsToShow.map((list: any) => {
          const percentage = list.total > 0 ? (list.played / list.total) * 100 : 0;

          return (
            <div
              key={list.listId}
              className="bg-card rounded-2xl border border-border/60 p-4 text-left space-y-2"
            >
              {/* Title */}
              <h3 className="font-semibold text-sm text-foreground">{list.listName}</h3>

              {/* Fraction */}
              <div className="text-2xl font-bold text-foreground">
                {list.played}
                <span className="text-base text-muted-foreground"> / {list.total}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                <div
                  className="h-full bg-primary-accent rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Completion % */}
              <div className="text-xs text-muted-foreground">
                {percentage.toFixed(0)}% complete
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
