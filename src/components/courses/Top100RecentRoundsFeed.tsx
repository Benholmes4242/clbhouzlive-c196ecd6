import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';
import CourseRankBadges from './CourseRankBadges';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
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
  const pageSize = 8;
  const [page, setPage] = React.useState(0);

  if (!rounds || rounds.length === 0) {
    return (
      <section className={cn("space-y-3", className)}>
        <h3 className="text-sm font-semibold text-foreground px-4 sm:px-0">
          Recent Top 100 Rounds
        </h3>
        <p className="text-sm text-muted-foreground px-4 sm:px-0">
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
      <h3 className="text-sm font-semibold text-foreground px-4 sm:px-0">
        Recent Top 100 Rounds
      </h3>

      <div className="space-y-3 sm:space-y-3">
        {current.map((round) => {
          // Extract rank badges from list memberships
          const ranks = {
            globalRank: round.list_slugs.includes('global') ? 1 : null, // Would need actual rank data
            regionalRank: round.list_slugs.includes('gb-i') ? 1 : null,
            usaRank: round.list_slugs.includes('usa') ? 1 : null,
          };

          return (
            <button
              key={`${round.course_id}-${round.played_at}`}
              type="button"
              onClick={() => navigate(`/courses/${round.course_id}`)}
              className="w-full rounded-none sm:rounded-xl overflow-hidden bg-card border border-border/60 text-left shadow-sm hover:shadow-md transition-all"
            >
              {/* Full-bleed course image with badges */}
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
                  
                  {/* Gradient overlay at bottom */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                  
                  {/* Top 100 rank badges - top left */}
                  <CourseRankBadges
                    globalRank={ranks.globalRank}
                    regionalRank={ranks.regionalRank}
                    usaRank={ranks.usaRank}
                    country={round.country || ''}
                    positioning="top-left"
                  />
                </div>
              )}

              {/* White metadata area at bottom */}
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

                  {/* Clubhouse rating with logo - right side */}
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
        <div className="flex justify-between gap-3 pt-2 px-4 sm:px-0">
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
