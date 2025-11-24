import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyTop100Progress } from '@/hooks/useMyTop100Progress';
import { getRingLabel, getRingColorClass } from '@/lib/top100Prestige';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const CourseTop100Summary: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const { data, isLoading } = useMyTop100Progress();

  // Logged out state
  if (!session) {
    return (
      <section className="px-4 pt-4 pb-5 bg-slate-50">
        <div className="bg-white border border-border rounded-2xl px-4 py-4 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">
            Your Top 100 Progress
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to track how this course fits into your Top 100 journey and
            see your progress across the world's greatest courses.
          </p>
          <button
            onClick={() => navigate('/auth?redirect=/courses')}
            className="inline-flex items-center justify-center rounded-lg bg-primary-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Sign in to view your journey
          </button>
        </div>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="px-4 pt-4 pb-5 bg-slate-50">
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
    bySlug('global'),
    bySlug('gb-i'),
    bySlug('usa'),
    bySlug('europe'),
  ].filter(Boolean);

  return (
    <section className="px-4 pt-4 pb-5 bg-slate-50 text-center">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Your Top 100 Progress
        </h2>
        <p className="text-sm text-muted-foreground">
          You've played {total} Top 100 course{total === 1 ? '' : 's'} across{' '}
          {regions} region{regions === 1 ? '' : 's'}.
        </p>
        
        {/* Prestige Ring & Milestone Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          {data.prestige_ring && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs">
              <span className={cn(
                "h-4 w-4 rounded-full border border-primary-accent/60 ring-2 ring-offset-[1px] ring-offset-background",
                getRingColorClass(data.prestige_ring)
              )} />
              {getRingLabel(data.prestige_ring)}
            </span>
          )}
          
          {data.prestige_label && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs text-primary-accent">
              <Trophy className="h-3 w-3" />
              {data.prestige_label}
            </span>
          )}
          
          {data.next_milestone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs text-muted-foreground">
              Next milestone: {data.next_milestone.remaining} more{' '}
              {data.next_milestone.remaining === 1 ? 'course' : 'courses'}
            </span>
          )}
        </div>
      </div>

      {/* 4-list grid with card tiles */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {listsToShow.map((list) => (
          <button
            key={list!.listSlug}
            onClick={() =>
              navigate(`/courses?tab=top-100&list=${list!.listSlug}`)
            }
            className="bg-white border border-border rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/50 shadow-sm"
          >
            <span className="text-xs font-medium text-muted-foreground mb-0.5 block">
              {list!.listName}
            </span>
            <span className="text-sm font-semibold text-foreground block">
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
      <div className="text-center">
        <button
          onClick={() => navigate('/top100?tab=my-progress')}
          className="mt-3 text-xs font-medium text-primary-accent hover:text-primary-accent/80 transition-colors"
        >
          View full Top 100 Journey →
        </button>
      </div>
    </section>
  );
};

export default CourseTop100Summary;
