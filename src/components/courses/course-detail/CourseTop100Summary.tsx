import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import type { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';

interface CourseTop100SummaryProps {
  userId?: string;
}

export function CourseTop100Summary({ userId }: CourseTop100SummaryProps) {
  const { t } = useTranslation('courses');
  const { data, isLoading } = useTop100ProgressForUser(userId);

  // TODO: if loading, show skeleton...
  if (isLoading) {
    return (
      <section className="px-4 pt-4 pb-5 bg-muted/30 text-center">
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

  // TODO: return null when no data instead of skeleton
  if (!data || !data.lists || data.lists.length === 0) {
    return null;
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

  const regionsText = t('courseDetail.top100Summary.regionsCount', { count: regions });

  return (
    <section className="px-4 pt-4 pb-5 bg-muted/30 text-center">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {t('courseDetail.top100Summary.heading')}
        </h2>
        <p className="text-base text-muted-foreground">
          {t('courseDetail.top100Summary.ratedCoursesLine', { count: totalRated, regionsText })}
        </p>
        
        {/* Club Ring & Milestone Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          {club.shortLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
              <span className={cn(
                "h-4 w-4 rounded-full border border-primary-accent/60 ring-2 ring-offset-[1px] ring-offset-background",
                getTop100RingBorderClass(club.tierId)
              )} />
              {club.shortLabel}
            </span>
          )}
          
          {data.next_milestone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-sm text-muted-foreground">
              {t('courseDetail.top100Summary.nextMilestone', { count: data.next_milestone.remaining, tierName: data.next_milestone.tierName })}
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
              className="bg-card rounded-sq-md border border-border/60 p-4 text-left space-y-2"
            >
              {/* Title */}
              <h3 className="font-semibold text-sm text-foreground">{list.listName}</h3>

              {/* Fraction */}
              <div className="text-2xl font-bold text-foreground">
                {list.played}
                <span className="text-base text-muted-foreground"> / {list.total}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(245,158,11,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                  }}
                />
              </div>

              {/* Completion % */}
              <div className="text-xs text-muted-foreground">
                {t('courseDetail.top100Summary.percentComplete', { pct: percentage.toFixed(0) })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
