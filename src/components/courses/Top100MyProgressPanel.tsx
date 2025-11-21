import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100Badges } from '@/hooks/useTop100Badges';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Trophy } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import Top100Pills from './Top100Pills';
import { getRingLabel, getRingColorClass } from '@/lib/top100Prestige';

interface Top100MyProgressPanelProps {
  userId?: string | null;
}

const Top100MyProgressPanel: React.FC<Top100MyProgressPanelProps> = ({ userId }) => {
  const { session } = useSupabaseSession();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100ProgressForUser(effectiveUserId);
  const { data: badges = [] } = useTop100Badges(effectiveUserId);
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === session?.user?.id;

  if (!effectiveUserId) {
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
        <h1 className="text-3xl font-bold text-foreground">
          {isOwnProfile ? 'Your Top 100 Journey' : 'Top 100 Journey'}
        </h1>
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? 'Track your elite pilgrimage across the world\'s greatest courses.'
            : 'See how far they\'ve come across the world\'s greatest courses.'}
        </p>
        <div className="text-sm text-foreground">
          {isOwnProfile ? "You've" : "They've"} played{' '}
          <span className="font-semibold">{data.total_played_top100}</span> Top 100 course
          {data.total_played_top100 === 1 ? '' : 's'} across{' '}
          <span className="font-semibold">{data.regions_count}</span>{' '}
          {data.regions_count === 1 ? 'region' : 'regions'}.
        </div>
        
        {/* Prestige Ring & Milestone Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {data.prestige_ring && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs">
              <span className={`h-4 w-4 rounded-full border border-primary-accent/60 ring-2 ring-offset-[1px] ring-offset-background ${getRingColorClass(data.prestige_ring)}`} />
              {getRingLabel(data.prestige_ring)}
            </span>
          )}
          
          {data.prestige_label && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs text-primary-accent">
              <Trophy className="h-3 w-3" />
              {data.prestige_label}
            </span>
          )}
          
          {isOwnProfile && data.next_milestone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs text-muted-foreground">
              Next milestone: {data.next_milestone.remaining} more{' '}
              {data.next_milestone.remaining === 1 ? 'course' : 'courses'}
            </span>
          )}
        </div>
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {data.lists.map((list) => (
          <div
            key={list.listSlug}
            className="p-4 rounded-xl bg-card border border-border/50 space-y-2"
          >
            <h3 className="text-sm font-semibold text-foreground">{list.listName}</h3>
            <p className="text-xs text-muted-foreground">
              {list.played} / {list.total} played
            </p>
            <Progress
              value={(list.played / list.total) * 100}
              className="h-1.5"
            />
          </div>
        ))}
      </div>

      {/* Badges Strip */}
      {badges.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-alt text-[10px]">
                  {badge.category === 'milestone' ? '🏆' : '🌍'}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{badge.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {badge.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-List Detail */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Progress by Region</h2>
        {data.lists.map((list) => (
          <div
            key={list.listSlug}
            className="p-4 rounded-xl bg-card border border-border/50 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{list.listName}</h3>
                <p className="text-sm text-muted-foreground">
                  {list.played} of {list.total} courses played
                </p>
                <p className="text-xs text-muted-foreground">
                  {list.played > 0
                    ? `${isOwnProfile ? "You've" : "They've"} ticked off ${list.played} in this list.`
                    : `${isOwnProfile ? "You haven't" : "They haven't"} started this list yet.`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/top100/${list.listSlug}`)}
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
            A log of {isOwnProfile ? 'your' : 'their'} latest rounds at Top 100 courses.
          </p>
        </div>

        {data.recent_rounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{isOwnProfile ? "You haven't" : "They haven't"} logged any rounds at Top 100 courses yet.</p>
            {isOwnProfile && (
              <p className="text-sm mt-1">
                Start your journey by playing one from the list above.
              </p>
            )}
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
                    {round.rating && ` · ${isOwnProfile ? 'Your' : 'Their'} rating: ${round.rating}`}
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
