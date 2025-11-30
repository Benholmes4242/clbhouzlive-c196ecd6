import React from 'react';
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type CourseTop100SpotlightProps = {
  courseId: string;
  courseName: string;
};

export const CourseTop100Spotlight: React.FC<CourseTop100SpotlightProps> = ({
  courseId,
  courseName,
}) => {
  const { data, isLoading } = useTop100CourseInsights(courseId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="mb-4 rounded-xl border border-border/60 bg-card px-4 py-4">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-3 h-3 w-56 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  if (!data || !data.list_memberships || data.list_memberships.length === 0) {
    // Not a Top 100 course – no spotlight
    return null;
  }

  const primaryList = data.list_memberships[0];

  const subtitle =
    data.list_memberships.length === 1
      ? `This course appears in the ${primaryList.list_name}.`
      : `This course appears in ${data.list_memberships
          .map((m) => m.list_name)
          .join(' · ')}.`;

  const lastPlayedText =
    data.user_has_played && data.user_last_played_at
      ? `Last round: ${format(new Date(data.user_last_played_at), 'd MMM yyyy')}`
      : null;

  const communityLineParts: string[] = [];
  if (data.unique_players > 0) {
    communityLineParts.push(
      `${data.unique_players} player${data.unique_players === 1 ? '' : 's'} on Clbhouz`
    );
  }
  if (data.total_rounds > 0) {
    communityLineParts.push(
      `${data.total_rounds} logged round${data.total_rounds === 1 ? '' : 's'}`
    );
  }
  if (data.avg_rating != null) {
    communityLineParts.push(`Avg rating ${data.avg_rating.toFixed(1)}/10`);
  }
  const communityLine =
    communityLineParts.length > 0 ? communityLineParts.join(' · ') : null;

  const handlePrimaryCta = () => {
    if (data.user_has_played) {
      // Send them to log / create a moment for this course
      navigate(`/create-moment?courseId=${courseId}`);
    } else {
      // For now, send them to rate/log or Discover Top 100
      navigate(`/discover?sub=top100&courseId=${courseId}`);
    }
  };

  const handleViewList = () => {
    if (!primaryList?.list_slug) return;
    navigate(`/top100/${primaryList.list_slug}`);
  };

  return (
    <section className="mb-5 rounded-xl border border-border/70 bg-card/80 px-4 py-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-primary-accent" />
            <span>Top 100 Spotlight</span>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        {/* List pills */}
        <div className="flex flex-wrap gap-2">
          {data.list_memberships.map((m) => (
            <div
              key={m.list_slug}
              className="rounded-full border border-primary-accent/40 bg-primary-accent/5 px-3 py-1 text-[11px] font-medium"
            >
              {m.short_label || m.list_name}
              {m.rank != null && (
                <span className="ml-1 text-[10px] text-primary-accent/80">
                  #{m.rank}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px w-full bg-border/60" />

      {/* Your status + community */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm">
          {/* User status pill */}
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
              data.user_has_played
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/10 text-amber-200 border border-amber-500/40'
            )}
          >
            {data.user_has_played ? 'Played by you' : 'Not yet on your Top 100 journey'}
            {data.user_round_count > 0 && (
              <span className="text-[11px] text-emerald-200/80">
                · {data.user_round_count} round
                {data.user_round_count === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Last played + community line */}
          {lastPlayedText && (
            <p className="text-xs text-muted-foreground">{lastPlayedText}</p>
          )}
          {communityLine && (
            <p className="text-xs text-muted-foreground">{communityLine}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handlePrimaryCta}>
            {data.user_has_played
              ? 'Log a new round here'
              : `Plan a round at ${courseName}`}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleViewList}
          >
            View in Top 100 list
          </Button>
        </div>
      </div>
    </section>
  );
};
