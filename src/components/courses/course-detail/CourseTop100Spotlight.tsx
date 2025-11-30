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
      <div className="mt-4 rounded-3xl border border-slate-100 bg-white/90 px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mb-3 h-4 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mb-3 flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
      </div>
    );
  }

  if (!data || !data.list_memberships || data.list_memberships.length === 0) {
    // Not a Top 100 course – no spotlight
    return null;
  }

  const primaryList = data.list_memberships[0];

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
    communityLineParts.push(`Avg rating ${data.avg_rating.toFixed(1)}`);
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
    <section className="mt-4 rounded-3xl border border-slate-100 bg-white/90 px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">
            Top 100 Spotlight
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This course appears in the world's Top 100 rankings.
          </p>
        </div>
        <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
      </div>

      {/* List badges */}
      {data.list_memberships.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {data.list_memberships.map((m) => (
            <span
              key={m.list_slug}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {m.short_label || m.list_name}
              {m.rank != null && (
                <span className="ml-1 text-slate-400">#{m.rank}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* User status */}
      <div className="mb-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
            data.user_has_played
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-50 text-slate-500'
          )}
        >
          {data.user_has_played ? 'Played by you' : 'Not yet played'}
          {data.user_round_count > 0 && (
            <span className="ml-1 text-slate-400">
              · {data.user_round_count} {data.user_round_count === 1 ? 'round' : 'rounds'}
            </span>
          )}
        </span>

        {lastPlayedText && data.user_has_played && (
          <p className="mt-1 text-xs text-slate-500">{lastPlayedText}</p>
        )}
      </div>

      {/* Community stats */}
      {communityLine && (
        <p className="mt-1 text-xs text-slate-500">{communityLine}</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="primary"
          onClick={handlePrimaryCta}
          className="w-full sm:w-auto"
        >
          {data.user_has_played ? 'Log a new round' : 'Log your first round'}
        </Button>

        <button
          type="button"
          onClick={handleViewList}
          className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          View in Top 100 list →
        </button>
      </div>
    </section>
  );
};
