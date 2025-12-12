import React from 'react';
import { Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';
import { UnifiedCourseCard } from './UnifiedCourseCard';
import { fromTop100Round } from '@/lib/mappers/toCourseCardModel';

interface Top100RecentRoundsFeedProps {
  rounds: Top100RecentRound[];
  isOwnProfile: boolean;
  className?: string;
}

export function Top100RecentRoundsFeed({
  rounds,
  isOwnProfile,
  className,
}: Top100RecentRoundsFeedProps) {
  const pageSize = 4;
  const [page, setPage] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil((rounds?.length || 0) / pageSize));
  const currentPage = Math.min(page + 1, totalPages);

  if (!rounds || rounds.length === 0) {
    return (
      <section className={cn("mt-6 w-full", className)}>
        <div className="flex items-center justify-between mb-2 px-2.5">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            Recent Top 100 rounds
          </h3>
        </div>
        <p className="text-xs text-muted-foreground px-1">
          {isOwnProfile
            ? 'No Top 100 rounds recorded yet. Visit the Courses tab to start your journey.'
            : 'No Top 100 rounds recorded yet.'}
        </p>
      </section>
    );
  }

  const start = page * pageSize;
  const current = rounds.slice(start, start + pageSize);
  const hasNext = start + pageSize < rounds.length;
  const hasPrev = page > 0;

  return (
    <section className={cn("w-full", className)}>
      {/* Section header - memory/reflection layer */}
      <div className="flex items-center justify-between mb-3 px-2.5">
        <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          Recent Top 100 rounds
        </h3>
      </div>

      <div className="space-y-3">
        {current.map((round) => (
          <UnifiedCourseCard
            key={`${round.course_id}-${round.played_at}`}
            course={fromTop100Round(round)}
            showRankBadges={true}
            showRating={true}
          />
        ))}
      </div>

      {/* Pagination - increased tap targets, reduced visual weight */}
      {(hasPrev || hasNext) && (
        <div className="mt-4 flex items-center justify-between gap-3 px-2.5">
          <button
            type="button"
            onClick={() => hasPrev && setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-xs font-medium transition-colors min-h-[44px]',
              hasPrev
                ? 'bg-card/60 hover:bg-muted/50 border-border/50 text-foreground'
                : 'bg-transparent border-border/30 text-muted-foreground/60 cursor-default'
            )}
          >
            Previous
          </button>

          <div className="min-w-[80px] text-center text-[10px] text-muted-foreground/70">
            {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() =>
              hasNext &&
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={!hasNext}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-xs font-medium transition-colors min-h-[44px]',
              hasNext
                ? 'bg-card/60 hover:bg-muted/50 border-border/50 text-foreground'
                : 'bg-transparent border-border/30 text-muted-foreground/60 cursor-default'
            )}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
