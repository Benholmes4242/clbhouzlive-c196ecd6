import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';
import CourseRankBadges from './CourseRankBadges';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

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
  const navigate = useNavigate();
  const pageSize = 4;
  const [page, setPage] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil((rounds?.length || 0) / pageSize));
  const currentPage = Math.min(page + 1, totalPages);

  if (!rounds || rounds.length === 0) {
    return (
      <section className={cn("mt-6 w-full", className)}>
        <div className="flex items-center justify-between mb-2 px-4 sm:px-1">
          <h3 className="text-sm font-semibold">
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
    <section className={cn("mt-6 w-full", className)}>
      <div className="flex items-center justify-between mb-2 px-4 sm:px-1">
        <h3 className="text-sm font-semibold">
          Recent Top 100 rounds
        </h3>
      </div>

      <div className="space-y-3">
        {current.map((round) => {

          return (
            <button
              key={`${round.course_id}-${round.played_at}`}
              type="button"
              onClick={() => navigate(`/courses/${round.course_id}`)}
              className="w-full rounded-none sm:rounded-xl overflow-hidden bg-card border-y sm:border border-border/60 text-left shadow-none sm:shadow-sm hover:sm:shadow-md transition-all"
            >
              {round.image_url && (
                <div className="relative w-full aspect-[1.6/1] overflow-hidden">
                  <img
                    src={round.image_url}
                    alt={round.course_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                  
                  <CourseRankBadges
                    globalRank={round.global_rank}
                    regionalRank={round.regional_rank}
                    usaRank={round.usa_rank}
                    country={round.country || ''}
                    positioning="top-left"
                  />
                </div>
              )}

              <div className="px-4 py-3 bg-background space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground">
                      {round.course_name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground">
                      {round.sub_country && `${round.sub_country}, `}
                      {round.country}
                    </p>
                  </div>

                  {round.rating != null && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ClubhouseLogo className="h-5 w-5" />
                      <span className="text-sm font-semibold text-foreground">
                        {round.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {(hasPrev || hasNext) && (
        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <button
            type="button"
            onClick={() => hasPrev && setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition-colors',
              hasPrev
                ? 'bg-card hover:bg-muted/70 border-border text-foreground'
                : 'bg-muted/40 border-border/60 text-muted-foreground cursor-default'
            )}
          >
            Previous
          </button>

          <div className="min-w-[90px] text-center text-[11px] text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>

          <button
            type="button"
            onClick={() =>
              hasNext &&
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={!hasNext}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition-colors',
              hasNext
                ? 'bg-card hover:bg-muted/70 border-border text-foreground'
                : 'bg-muted/40 border-border/60 text-muted-foreground cursor-default'
            )}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
