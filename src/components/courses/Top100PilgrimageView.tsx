import { useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100SeasonStats } from '@/hooks/useTop100SeasonStats';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Top100PilgrimageViewProps {
  userId?: string | null;
}

function computeMonthlyStreak(firstPlayDates: string[]) {
  if (!firstPlayDates.length) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      months: [] as { key: string; label: string; hasPlay: boolean }[],
    };
  }

  // Group first-play dates by year-month
  const monthMap = new Map<string, number>();
  firstPlayDates.forEach((iso) => {
    const d = new Date(iso);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });

  const sortedKeys = Array.from(monthMap.keys()).sort();
  let best = 0;
  let current = 0;
  let lastYear = 0;
  let lastMonth = 0;

  sortedKeys.forEach((key) => {
    const [yStr, mStr] = key.split('-');
    const y = Number(yStr);
    const m = Number(mStr); // 1–12

    if (
      lastYear === 0 ||
      (y === lastYear && m === lastMonth + 1) ||
      (y === lastYear + 1 && lastMonth === 12 && m === 1)
    ) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > best) best = current;
    lastYear = y;
    lastMonth = m;
  });

  // Build a simple month row for the current year
  const now = new Date();
  const currentYear = now.getFullYear();
  const months = Array.from({ length: 12 }).map((_, idx) => {
    const monthIndex = idx + 1;
    const key = `${currentYear}-${String(monthIndex).padStart(2, '0')}`;
    const hasPlay = monthMap.has(key);
    const label = format(new Date(currentYear, monthIndex - 1, 1), 'MMM');
    return { key, label, hasPlay };
  });

  return {
    currentStreak: current,
    bestStreak: best,
    months,
  };
}

function getSeasonGoal(lifetimeTotal: number) {
  if (lifetimeTotal < 10) return 3;
  if (lifetimeTotal < 30) return 5;
  return 10;
}

export function Top100PilgrimageView({ userId }: Top100PilgrimageViewProps) {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const effectiveUserId = userId ?? session?.user?.id ?? null;
  const { data, isLoading } = useTop100ProgressForUser(effectiveUserId);
  const { data: seasonStats } = useTop100SeasonStats({ userId: effectiveUserId });

  const isOwnProfile = !userId || userId === session?.user?.id;

  const streak = useMemo(
    () => computeMonthlyStreak(seasonStats?.first_play_dates ?? []),
    [seasonStats?.first_play_dates]
  );

  const seasonGoal = getSeasonGoal(seasonStats?.lifetime_total_top100 ?? 0);
  const seasonProgress = seasonStats?.new_top100_this_season ?? 0;
  const listsTouched = seasonStats?.lists_touched_this_season ?? 0;

  // Derive journeys started/completed
  const journeys = useMemo(() => {
    if (!data || !seasonStats) {
      return { started: 0, completed: 0 };
    }

    const newByList = seasonStats.new_by_list || {};
    let started = 0;
    let completed = 0;

    data.lists.forEach((list) => {
      const newThisSeason = newByList[list.listSlug] ?? 0;

      if (newThisSeason > 0) {
        // If lifetime played equals newThisSeason: they only started this list this season
        if (list.played === newThisSeason) {
          started += 1;
        }

        // Completed list where some of that progress came this season
        if (list.played >= list.total && list.total > 0) {
          completed += 1;
        }
      }
    });

    return { started, completed };
  }, [data, seasonStats]);

  if (!effectiveUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to track your Top 100 pilgrimage
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="px-4 py-2 rounded-lg bg-primary-accent text-white text-sm font-medium"
        >
          Sign in
        </button>
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

  // If they have no Top 100 journey at all yet
  if (!data || data.total_played_top100 === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
        <div className="font-medium text-foreground mb-1">
          Your Top 100 pilgrimage hasn&apos;t started yet.
        </div>
        <p>
          Play your first Top 100 course and log the round to unlock Pilgrimage Mode.
        </p>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => navigate('/discover?sub=top100')}
        >
          Find a Top 100 course
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Season Goal Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide uppercase text-primary-accent mb-1">
            This season&apos;s pilgrimage
          </div>
          <div className="text-lg md:text-xl font-semibold text-foreground">
            Play {seasonGoal} new Top 100 courses
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ve unlocked{' '}
            <span className="font-semibold text-foreground">
              {seasonProgress} / {seasonGoal}
            </span>{' '}
            new Top 100s this season across{' '}
            <span className="font-semibold text-foreground">
              {listsTouched}
            </span>{' '}
            region{listsTouched === 1 ? '' : 's'}.
          </p>
          {(streak.currentStreak > 0 || streak.bestStreak > 0) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Current streak:{' '}
              <span className="font-medium text-foreground">
                {streak.currentStreak} month
                {streak.currentStreak === 1 ? '' : 's'}
              </span>
              {streak.bestStreak > 0 && (
                <>
                  {' '}· Best:{' '}
                  <span className="font-medium text-foreground">
                    {streak.bestStreak} month
                    {streak.bestStreak === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col md:items-end gap-2">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary-accent" />
            New Top 100 unlocked this season
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/discover?sub=top100')}
          >
            Find your next Top 100 stop
          </Button>
        </div>
      </div>

      {/* Streak Month Row */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">
            Monthly streak
          </div>
          <div className="text-xs text-muted-foreground">
            Filled dots = months you added a new Top 100
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {streak.months.map((m) => (
            <div
              key={m.key}
              className={cn(
                'flex flex-col items-center gap-1 text-xs',
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full border flex items-center justify-center text-[0.75rem]',
                  m.hasPlay
                    ? 'bg-primary-accent text-background border-primary-accent'
                    : 'border-border text-muted-foreground'
                )}
              >
                {m.label.charAt(0)}
              </div>
              <span className="text-[0.65rem] text-muted-foreground">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quests */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            Pilgrimage quests
          </div>
          <div className="text-xs text-muted-foreground">
            Soft goals to nudge your next moves
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {/* Quest 1: New region */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground">
                New region
              </span>
              <span className="text-[0.7rem] text-muted-foreground">
                {listsTouched >= 3 ? 'Done' : `${listsTouched}/3`}
              </span>
            </div>
            <p className="text-muted-foreground">
              Play a new Top 100 course in a region you&apos;ve barely touched.
            </p>
          </div>

          {/* Quest 2: GB&I push (example) */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground">
                GB&I push
              </span>
            </div>
            <p className="text-muted-foreground">
              Add 2 more Top 100 courses in Great Britain &amp; Ireland this season.
            </p>
          </div>

          {/* Quest 3: Review quest */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground">
                Leave your mark
              </span>
            </div>
            <p className="text-muted-foreground">
              Go back to a Top 100 you&apos;ve played and leave a full review &amp; rating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
