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
      <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.7)]">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-slate-800" />
        <div className="mb-3 h-4 w-64 animate-pulse rounded bg-slate-800" />
        <div className="mb-3 flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-800" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-slate-800" />
        </div>
        <div className="h-7 w-32 animate-pulse rounded-full bg-slate-800" />
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
    communityLineParts.push(`${data.avg_rating.toFixed(1)} community rating`);
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
    <section className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.7)]">
      {/* Header row */}
      <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Top 100 Spotlight
          </p>
          <h3 className="text-[13px] font-semibold text-slate-50 sm:text-sm">
            {courseName}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
        </div>

        {/* List pills */}
        <div className="flex flex-wrap justify-end gap-1.5">
          {data.list_memberships.map((m) => (
            <span
              key={m.list_slug}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2.5 py-[3px] text-[10px] text-slate-200"
            >
              <span>{m.short_label || m.list_name}</span>
              {m.rank != null && (
                <span className="rounded-full bg-slate-800/90 px-1.5 py-[1px] text-[10px] text-amber-300">
                  #{m.rank}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mb-2 border-t border-slate-800/70" />

      {/* Status + community + CTAs */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-2.5 py-[3px] text-[11px] text-slate-200">
            <span>
              {data.user_has_played
                ? 'Played by you'
                : 'Not yet on your Top 100 journey'}
            </span>
            {data.user_round_count > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span>
                  {data.user_round_count} round
                  {data.user_round_count === 1 ? '' : 's'}
                </span>
              </>
            )}
          </p>

          {lastPlayedText && (
            <p className="text-[11px] text-slate-400">{lastPlayedText}</p>
          )}
          {communityLine && (
            <p className="text-[11px] text-slate-400">{communityLine}</p>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-white"
          >
            {data.user_has_played
              ? 'Log a new round here'
              : `Plan a round at ${courseName}`}
          </button>

          <button
            type="button"
            onClick={handleViewList}
            className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-950 px-3.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-slate-500 hover:text-slate-50"
          >
            View in Top 100 list
          </button>
        </div>
      </div>
    </section>
  );
};
