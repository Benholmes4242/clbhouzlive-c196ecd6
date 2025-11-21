import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100MyProgress } from '@/hooks/useTop100MyProgress';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Trophy } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import Top100Pills from './Top100Pills';

const Top100MyProgressPanel = () => {
  const { session } = useSupabaseSession();
  const { data, isLoading } = useTop100MyProgress(session?.user?.id);
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sign in to track your Top 100 progress</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">My Top 100 Journey</h1>
        <p className="text-muted-foreground">
          See how far you've come across the world's greatest courses.
        </p>
        <div className="text-sm text-foreground">
          You've played{' '}
          <span className="font-semibold">{data.total_played_top100}</span> Top 100 courses
          across <span className="font-semibold">{data.regions_count}</span>{' '}
          {data.regions_count === 1 ? 'region' : 'regions'}.
        </div>
        {data.next_milestone && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-accent/10 border border-primary-accent/20">
            <Trophy className="w-4 h-4 text-primary-accent" />
            <span className="text-sm font-medium text-foreground">
              Next milestone: {data.next_milestone.remaining} more{' '}
              {data.next_milestone.remaining === 1 ? 'course' : 'courses'} to unlock the{' '}
              {data.next_milestone.label} badge
            </span>
          </div>
        )}
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {data.lists.map((list) => (
          <div
            key={list.list_slug}
            className="p-4 rounded-xl bg-card border border-border/50 space-y-2"
          >
            <h3 className="text-sm font-semibold text-foreground">{list.list_name}</h3>
            <p className="text-xs text-muted-foreground">
              {list.played_courses} / {list.total_courses} played
            </p>
            <Progress
              value={(list.played_courses / list.total_courses) * 100}
              className="h-1.5"
            />
          </div>
        ))}
      </div>

      {/* Per-List Detail */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Progress by Region</h2>
        {data.lists.map((list) => (
          <div
            key={list.list_slug}
            className="p-4 rounded-xl bg-card border border-border/50 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{list.list_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {list.played_courses} of {list.total_courses} courses played
                </p>
                <p className="text-xs text-muted-foreground">
                  {list.played_courses > 0
                    ? `You've ticked off ${list.played_courses} in this list.`
                    : "You haven't started this list yet."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/top100/${list.list_slug}`)}
                className="text-primary-accent hover:text-primary-accent/80"
              >
                View courses
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Rounds */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recent Top 100 rounds</h2>
          <p className="text-sm text-muted-foreground">
            A log of your latest rounds at Top 100 courses.
          </p>
        </div>

        {data.recent_rounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>You haven't logged any rounds at Top 100 courses yet.</p>
            <p className="text-sm mt-1">
              Start your journey by playing one from the list above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recent_rounds.map((round) => {
              const listMemberships = round.list_slugs.map((slug) => ({
                list_slug: slug,
                short_label: slug.replace('-top-100', '').toUpperCase(),
                rank: 0,
              }));

              return (
                <div
                  key={`${round.course_id}-${round.played_at}`}
                  className="p-3 rounded-lg bg-card border border-border/50 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {round.course_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {round.country && (
                          <>
                            <CountryFlag country={round.country} size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {round.country}
                              {round.sub_country && `, ${round.sub_country}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {listMemberships.length > 0 && (
                      <Top100Pills memberships={listMemberships} variant="inline" size="sm" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Played{' '}
                    {formatDistanceToNow(new Date(round.played_at), { addSuffix: true })}
                    {round.rating && ` · Your rating: ${round.rating}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Top100MyProgressPanel;
