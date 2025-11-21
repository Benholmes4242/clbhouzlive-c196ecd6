import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyTop100Progress } from '@/hooks/useMyTop100Progress';
import { getRingLabel } from '@/lib/top100Prestige';
import { cn } from '@/lib/utils';

const CourseTop100Summary: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const { data, isLoading } = useMyTop100Progress();

  // Logged out state
  if (!session) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Your Top 100 Progress
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Sign in to track how this course fits into your Top 100 journey and
          see your progress across the world's greatest courses.
        </p>
        <button
          onClick={() => navigate('/auth?redirect=/courses')}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--primary-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Sign in to view your journey
        </button>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="h-4 w-40 rounded bg-surface-alt mb-3" />
        <div className="h-3 w-64 rounded bg-surface-alt mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-surface-alt" />
          <div className="h-20 rounded-xl bg-surface-alt" />
          <div className="h-20 rounded-xl bg-surface-alt" />
          <div className="h-20 rounded-xl bg-surface-alt" />
        </div>
      </section>
    );
  }

  const ringLabel = getRingLabel(data.prestige_ring);
  const total = data.total_played_top100;
  const regions = data.regions_count;

  // Helper to get a list by slug (we only care about the 4 hero lists)
  const bySlug = (slug: string) =>
    data.lists.find((l) => l.listSlug === slug);

  const listsToShow = [
    bySlug('global-top-100'),
    bySlug('gb-i-top-100'),
    bySlug('usa-top-100'),
    bySlug('europe-top-100'),
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Your Top 100 Progress
          </h2>
          <p className="text-sm text-muted-foreground">
            You've played {total} Top 100 course{total === 1 ? '' : 's'} across{' '}
            {regions} region{regions === 1 ? '' : 's'}.
          </p>
          {data.next_milestone && (
            <p className="mt-1 text-xs text-muted-foreground">
              Next milestone: {data.next_milestone.remaining} more{' '}
              {data.next_milestone.remaining === 1 ? 'course' : 'courses'} to
              reach {data.next_milestone.label}.
            </p>
          )}
        </div>

        {ringLabel && (
          <div className="inline-flex items-center rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-muted-foreground">
            {ringLabel}
          </div>
        )}
      </div>

      {/* 4-list grid */}
      <div className="grid grid-cols-2 gap-3">
        {listsToShow.map((list) => (
          <button
            key={list!.listSlug}
            onClick={() =>
              navigate(`/courses?tab=top-100&list=${list!.listSlug}`)
            }
            className={cn(
              'flex flex-col items-start rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors',
              'hover:border-[var(--primary-accent)]/70 hover:bg-card'
            )}
          >
            <span className="text-xs font-medium text-muted-foreground mb-0.5">
              {list!.listName}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {list!.played} / {list!.total} played
            </span>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full bg-[var(--primary-accent)]"
                style={{
                  width: `${Math.min(
                    100,
                    (list!.played / Math.max(1, list!.total)) * 100
                  )}%`,
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Link to full journey */}
      <button
        onClick={() => navigate(`/profile/${session.user.id}?tab=top100`)}
        className="mt-3 text-xs font-medium text-[var(--primary-accent)] hover:opacity-80 transition-opacity"
      >
        View full Top 100 Journey →
      </button>
    </section>
  );
};

export default CourseTop100Summary;
