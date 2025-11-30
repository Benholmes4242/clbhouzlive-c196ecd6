import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import Top100Pills from './Top100Pills';
import { Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';

interface Top100RecentRoundsFeedProps {
  rounds: Top100RecentRound[];
  isOwnProfile: boolean;
  maxDisplay?: number;
}

export function Top100RecentRoundsFeed({
  rounds,
  isOwnProfile,
  maxDisplay = 5,
}: Top100RecentRoundsFeedProps) {
  const displayRounds = rounds.slice(0, maxDisplay);

  if (rounds.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Top 100 Rounds</h3>
        <div className="text-center py-8 px-4 rounded-xl bg-surface-alt">
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "You haven't logged any rounds at Top 100 courses yet."
              : "They haven't logged any Top 100 rounds yet."}
          </p>
          {isOwnProfile && (
            <p className="text-xs text-muted-foreground mt-1">
              Play a course from one of the lists above to get started.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent Top 100 Rounds</h3>
        {rounds.length > maxDisplay && (
          <button className="text-xs text-primary-accent hover:text-primary-accent/80 flex items-center gap-1">
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayRounds.map((round, index) => {
          const listMemberships = round.list_slugs.map((slug) => ({
            list_slug: slug,
            short_label: slug.replace('-top-100', '').toUpperCase(),
            rank: 0,
          }));

          return (
            <div
              key={`${round.course_id}-${index}`}
              className="p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {round.course_name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {round.country && (
                      <div className="flex items-center gap-1.5">
                        <CountryFlag country={round.country} size="sm" />
                        <span>
                          {round.country}
                          {round.sub_country && `, ${round.sub_country}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Played{' '}
                      {formatDistanceToNow(new Date(round.played_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {round.rating && (
                      <>
                        <span>·</span>
                        <span className="text-primary-accent">
                          {isOwnProfile ? 'Your' : 'Their'} rating: {round.rating}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {listMemberships.length > 0 && (
                  <div className="flex-shrink-0">
                    <Top100Pills
                      memberships={listMemberships}
                      variant="inline"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
