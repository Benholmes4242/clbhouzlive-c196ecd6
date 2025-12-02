import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Top100Pills from './Top100Pills';
import { Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';

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
  const pageSize = 8;
  const [page, setPage] = React.useState(0);

  if (!rounds || rounds.length === 0) {
    return (
      <section className={cn("space-y-3", className)}>
        <h3 className="text-sm font-semibold text-foreground">
          Recent Top 100 Rounds
        </h3>
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? "No Top 100 rounds yet. Visit the Courses tab to explore."
            : "No Top 100 rounds recorded yet."}
        </p>
      </section>
    );
  }

  const start = page * pageSize;
  const current = rounds.slice(start, start + pageSize);
  const hasNext = start + pageSize < rounds.length;
  const hasPrev = page > 0;

  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">
        Recent Top 100 Rounds
      </h3>

      <div className="space-y-3">
        {current.map((round) => {
          const listMemberships = round.list_slugs.map((slug) => ({
            list_slug: slug,
            short_label: slug.replace('-top-100', '').toUpperCase(),
            rank: 0,
          }));

          return (
            <button
              key={`${round.course_id}-${round.played_at}`}
              type="button"
              onClick={() => navigate(`/courses/${round.course_id}`)}
              className="w-full rounded-2xl overflow-hidden bg-card border border-border/50 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              {round.image_url && (
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src={round.image_url}
                    alt={round.course_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="px-4 py-3 space-y-1 bg-background">
                <p className="text-sm font-semibold text-foreground">
                  {round.course_name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {round.sub_country && `${round.sub_country}, `}
                  {round.country}
                </p>

                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="text-muted-foreground">
                    Played {formatDistanceToNow(new Date(round.played_at), { addSuffix: true })}
                  </span>
                  {round.rating != null && (
                    <span className="font-semibold text-primary-accent">
                      Your rating: {round.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {listMemberships.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Top100Pills
                      memberships={listMemberships}
                      variant="inline"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {(hasPrev || hasNext) && (
        <div className="flex justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => hasPrev && setPage((p) => p - 1)}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => hasNext && setPage((p) => p + 1)}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
