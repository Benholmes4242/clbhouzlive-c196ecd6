import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Pilgrimage } from '@/hooks/useTop100Pilgrimage';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Top100PilgrimageViewProps {
  userId?: string | null;
}

export function Top100PilgrimageView({ userId }: Top100PilgrimageViewProps) {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100Pilgrimage(effectiveUserId);

  const isOwnProfile = !userId || userId === session?.user?.id;

  if (!effectiveUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to track your Top 100 pilgrimage
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/auth')}
        >
          Sign in
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl bg-surface-alt h-48" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-alt h-24" />
          <div className="rounded-xl bg-surface-alt h-24" />
        </div>
        <div className="space-y-2">
          <div className="rounded-xl bg-surface-alt h-16" />
          <div className="rounded-xl bg-surface-alt h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Season Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 p-5 shadow-lg border border-slate-700/60">
        <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
          Pilgrimage Mode
        </div>
        <h2 className="text-xl font-semibold mb-1">
          {isOwnProfile ? 'Your current Top 100 season' : 'Current Top 100 season'}
        </h2>
        <p className="text-sm text-slate-200/80 mb-4">
          {isOwnProfile
            ? 'Chasing new pins, one Top 100 at a time.'
            : 'Their chase for new pins across the Top 100.'}
        </p>

        {/* Season Goal + progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>
              Season goal: {data.season_goal} new Top 100s in {data.season_year}
            </span>
            <span>
              {data.season_progress}/{data.season_goal}
            </span>
          </div>
          <Progress
            value={(data.season_progress / data.season_goal) * 100}
            className="h-2 bg-slate-800"
          />
          <div className="text-xs text-slate-200/80">
            {data.has_hit_goal
              ? 'Season goal completed – all bonus golf from here.'
              : `${data.season_remaining} more course${
                  data.season_remaining === 1 ? '' : 's'
                } to hit your goal.`}
          </div>
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border/60 p-3">
          <div className="text-xs text-muted-foreground">Current streak</div>
          <div className="mt-1 text-2xl font-semibold">
            {data.streak_months} month{data.streak_months === 1 ? '' : 's'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Consecutive months with a new Top 100.
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/60 p-3">
          <div className="text-xs text-muted-foreground">Longest streak</div>
          <div className="mt-1 text-2xl font-semibold">
            {data.longest_streak_months} month
            {data.longest_streak_months === 1 ? '' : 's'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Personal best run of monthly new pins.
          </div>
        </div>
      </div>

      {/* Big Wins */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent big wins</h3>
        </div>
        {data.big_wins.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No first-time Top 100 rounds yet this season.
          </p>
        ) : (
          <div className="space-y-2">
            {data.big_wins.slice(0, 4).map(win => (
              <button
                key={win.course_id + win.played_at}
                onClick={() => navigate(`/courses/${win.course_id}`)}
                className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 hover:border-primary-accent/60 transition-all text-left"
              >
                <div>
                  <div className="text-sm font-medium">{win.course_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {win.sub_country && `${win.sub_country}, `}
                    {win.country} · {win.list_name}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(win.played_at), {
                    addSuffix: true,
                  })}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next Stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Next stops</h3>
        </div>
        {data.next_stops.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Once you log some Top 100 rounds we'll suggest high-impact next stops.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.next_stops.slice(0, 4).map(stop => (
              <button
                key={stop.course_id}
                className="flex flex-col items-start rounded-xl border border-border/60 bg-card p-3 text-left hover:border-primary-accent/60 hover:shadow-lg transition-all"
                onClick={() => navigate(`/courses/${stop.course_id}`)}
              >
                <div className="text-sm font-medium mb-1">{stop.course_name}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  {stop.sub_country && `${stop.sub_country}, `}
                  {stop.country}
                </div>
                {stop.rank && (
                  <div className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-muted-foreground">
                    #{stop.rank} · {stop.list_name}
                  </div>
                )}
                <div className="mt-1 text-[11px] text-primary-accent/90">
                  {stop.reason === 'list_completion' &&
                    'Closest to completing this list.'}
                  {stop.reason === 'closest_rank' &&
                    'Highest-ranked unplayed course.'}
                  {stop.reason === 'milestone_push' &&
                    'High impact towards your next milestone.'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
