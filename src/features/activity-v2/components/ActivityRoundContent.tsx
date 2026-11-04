/** AC1 owns only round presentation and threshold rules. Navigation stays in
 * LedgerRow; short course names and score colours retain their shared owners. */
import React from 'react';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { RAMP_DIST, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import type { ActivityRoundSummary } from '../hooks/useActivityRoundSummaries';

export function betterThanAverage(summary: ActivityRoundSummary): number | null {
  if (summary.other_rounds_here < 3 || summary.avg_to_par_here == null) return null;
  const difference = summary.avg_to_par_here - summary.to_par;
  return Number.isFinite(difference) && difference >= 1 ? Math.round(difference) : null;
}
export function activityHoleColor(value: number | null): string {
  if (value == null) return 'var(--activity-hole-missing)';
  if (value <= -2) return RAMP_DIST.eagles;
  if (value === -1) return RAMP_DIST.birdie;
  if (value === 0) return 'var(--activity-hole-par)';
  return value === 1 ? RAMP_DIST.bogey : RAMP_DIST.double;
}
export function ActivityRoundContent({ actor, summary, time }: { actor: React.ReactNode; summary?: ActivityRoundSummary; time: string }) {
  const better = summary ? betterThanAverage(summary) : null;
  return <>
    <div className="activity-round-sentence"><strong className="font-semibold">{actor}</strong>{summary ? ` shot ${summary.gross} at ${shortCourseName(summary.course_name)}` : ' shared a round'}</div>
    <div className="activity-round-meta">{time}{summary ? <>{summary.at_viewer_club && <> · <span className="text-[color:var(--activity-ink)]">your club</span></>}{better != null && ` · ${better} better than their average there`}</> : ' · scorecard not ready yet'}</div>
    {!!summary?.hole_to_par?.length && <div className="activity-hole-strip" data-testid="activity-hole-strip">{summary.hole_to_par.map((value, i) => <i key={i} data-hole-value={value ?? 'missing'} style={{ background: activityHoleColor(value) }} />)}</div>}
  </>;
}
export function ActivityRoundTile({ summary }: { summary: ActivityRoundSummary }) {
  return <div className="activity-score-tile" data-testid="activity-score-tile"><b>{summary.gross}</b><span>{summary.holes_played === 9 ? '9 holes' : toParParts(summary.to_par, 0)?.text}</span></div>;
}