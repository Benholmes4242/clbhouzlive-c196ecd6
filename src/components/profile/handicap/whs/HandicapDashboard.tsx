import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { callSyncWhsOne } from '@/lib/whs/api';
import {
  useHandicapTrend,
  useLastRound,
  useCounters,
  useRecentRounds,
  whsKeys,
} from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
  userId: string;
}

const fmtDelta = (n: number) => Math.abs(n).toFixed(1);
const fmtDiff = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const relativeDay = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(d, 'd MMM');
};

const HeroSkeleton = () => (
  <div className="px-5 pt-8 pb-7 animate-pulse">
    <div className="h-3 w-44 bg-muted/60 rounded mb-5" />
    <div className="h-16 w-28 bg-muted rounded mb-3" />
    <div className="h-4 w-36 bg-muted/60 rounded" />
  </div>
);

const RowSkeleton = () => (
  <div className="px-5 py-3 animate-pulse flex items-center justify-between">
    <div className="space-y-1.5">
      <div className="h-3.5 w-40 bg-muted rounded" />
      <div className="h-3 w-24 bg-muted/60 rounded" />
    </div>
    <div className="h-4 w-12 bg-muted rounded" />
  </div>
);

export const HandicapDashboard: React.FC<Props> = ({ connection, userId }) => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(
    connection.last_sync_status === 'auth_failed'
  );

  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: lastRound, isLoading: lastLoading } = useLastRound(connection.id);
  const { data: counters, isLoading: countersLoading } = useCounters(connection.id);
  const { data: recent, isLoading: recentLoading } = useRecentRounds(connection.id);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const data = await callSyncWhsOne();
      if (!data.ok) {
        if (data.error === 'credentials_invalid') {
          setReauthRequired(true);
          toast.error('Your England Golf password changed. Please disconnect and reconnect.');
          return;
        }
        toast.error(data.message ?? "Couldn't sync right now. Try again later.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: whsKeys.connection(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.trend(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.lastRound(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.counters(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.recent(connection.id) });
      if (data.handicap_changed && typeof data.handicap_index === 'number') {
        toast.success(`Handicap updated to ${data.handicap_index.toFixed(1)}!`);
      } else {
        toast.success('Refreshed — no changes');
      }
    } catch {
      toast.error("Couldn't reach clbhouz. Check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Stale warning
  const lastSyncedAt = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const isStale =
    lastSyncedAt &&
    Date.now() - lastSyncedAt.getTime() > 24 * 3600_000 &&
    connection.last_sync_status !== 'auth_failed';

  // Trend label
  let trendNode: React.ReactNode = null;
  if (trendLoading) {
    trendNode = <span className="h-4 w-28 bg-muted/60 rounded inline-block" />;
  } else if (trend) {
    if (trend.delta === null && !trend.hasHistory) {
      trendNode = (
        <span className="text-[13px] text-muted-foreground">New connection — trend coming soon</span>
      );
    } else if (trend.delta !== null && Math.abs(trend.delta) < 0.05) {
      trendNode = <span className="text-[13px] text-muted-foreground">— No change in 30 days</span>;
    } else if (trend.delta !== null && trend.delta < 0) {
      trendNode = (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-semibold"
          style={{ background: 'rgba(16,185,129,0.10)', color: '#059669' }}
        >
          <ArrowDown className="h-3 w-3" /> {fmtDelta(trend.delta)} in 30 days
        </span>
      );
    } else if (trend.delta !== null && trend.delta > 0) {
      trendNode = (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-semibold"
          style={{ background: 'rgba(220,38,38,0.10)', color: '#B91C1C' }}
        >
          <ArrowUp className="h-3 w-3" /> {fmtDelta(trend.delta)} in 30 days
        </span>
      );
    }
  }

  const memberSince = connection.created_at
    ? `Member since ${format(new Date(connection.created_at), 'MMM yyyy')}`
    : 'England Golf member';

  return (
    <div className="pb-10">
      {/* Stale / re-auth warnings */}
      {reauthRequired ? (
        <div
          className="mx-5 mt-5 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(220,38,38,0.06)', color: '#B91C1C' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your stored England Golf password no longer works. We can't refresh your data. Please
            disconnect and reconnect.
          </p>
        </div>
      ) : isStale && lastSyncedAt ? (
        <div
          className="mx-5 mt-5 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(247,147,30,0.08)', color: '#9A6116' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your handicap data hasn't refreshed in{' '}
            {formatDistanceToNow(lastSyncedAt, { addSuffix: false })}. Tap "Sync now" to refresh.
          </p>
        </div>
      ) : null}

      {/* HERO */}
      {trendLoading && !trend ? (
        <HeroSkeleton />
      ) : (
        <section className="px-5 pt-8 pb-7">
          <p className="text-[12px] text-muted-foreground mb-3">{memberSince}</p>
          <div className="flex items-end gap-3 mb-2">
            <span
              className="font-extrabold text-foreground tabular-nums leading-none"
              style={{ fontSize: 64, letterSpacing: '-0.02em' }}
            >
              {trend?.current !== null && trend?.current !== undefined
                ? trend.current.toFixed(1)
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-muted-foreground">Handicap Index</span>
            <span>{trendNode}</span>
          </div>
        </section>
      )}

      <div className="h-px mx-5 mb-5" style={{ background: 'rgba(15,23,42,0.08)' }} />

      {/* LAST ROUND */}
      <section className="px-5 mb-7">
        {lastLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-24 bg-muted/60 rounded" />
            <div className="h-5 w-44 bg-muted rounded" />
            <div className="h-7 w-56 bg-muted/70 rounded" />
          </div>
        ) : lastRound ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
                Last Round
              </p>
              <p className="text-[12px] text-muted-foreground">{relativeDay(lastRound.play_date)}</p>
            </div>
            <h3 className="text-[19px] font-bold text-foreground leading-tight mb-3">
              {lastRound.course?.name ?? 'Unknown course'}
            </h3>
            <div className="flex items-baseline gap-6 mb-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Gross
                </p>
                <p className="text-[30px] font-bold text-foreground tabular-nums leading-none">
                  {lastRound.adjusted_gross ?? '—'}
                </p>
              </div>
              {lastRound.stableford_points !== null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                    Stableford
                  </p>
                  <p className="text-[20px] font-semibold text-foreground tabular-nums leading-none">
                    {lastRound.stableford_points}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Diff
                </p>
                <p className="text-[20px] font-semibold text-foreground tabular-nums leading-none">
                  {fmtDiff(lastRound.handicap_differential)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span>
                {lastRound.marker_name ?? 'Tee'} ·{' '}
                {lastRound.course_rating ?? '—'}/{lastRound.slope_rating ?? '—'}
              </span>
              {lastRound.is_counter && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold"
                  style={{ background: 'rgba(16,185,129,0.10)', color: '#059669' }}
                >
                  <CheckCircle2 className="h-3 w-3" /> Counter
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-muted-foreground">
            Your rounds will appear here as soon as you start posting scores in MyEG.
          </p>
        )}
      </section>

      {/* COUNTERS STRIP */}
      {(countersLoading || (counters && counters.length > 0)) && (
        <section className="mb-8">
          <div className="px-5 mb-1">
            <h3 className="text-[16px] font-bold text-foreground">Your 8 counting rounds</h3>
            <p className="text-[13px] text-muted-foreground">
              These are the rounds making up your current handicap
            </p>
          </div>
          <div
            className="flex gap-3 px-5 pt-3 pb-2 overflow-x-auto"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {countersLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[120px] h-[110px] rounded-xl bg-muted/60 animate-pulse"
                  />
                ))
              : counters?.map((c) => (
                  <div
                    key={c.id}
                    className="flex-shrink-0 w-[120px] rounded-xl border p-3 bg-background"
                    style={{
                      borderColor: 'rgba(15,23,42,0.08)',
                      scrollSnapAlign: 'start',
                      borderLeftWidth: 3,
                      borderLeftColor: '#10B981',
                    }}
                  >
                    <p className="text-[24px] font-bold text-foreground tabular-nums leading-none mb-2">
                      {c.handicap_differential !== null && c.handicap_differential !== undefined
                        ? c.handicap_differential.toFixed(1)
                        : '—'}
                    </p>
                    <p className="text-[12px] text-foreground/80 truncate mb-1">
                      {c.course?.name ?? '—'}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {format(new Date(c.play_date), 'd MMM')}
                    </p>
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* RECENT ROUNDS */}
      <section className="mb-6">
        <div className="px-5 flex items-end justify-between mb-2">
          <h3 className="text-[16px] font-bold text-foreground">Recent rounds</h3>
          <span className="text-[12px] text-muted-foreground">Last 20</span>
        </div>
        <div>
          {recentLoading ? (
            Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
          ) : recent && recent.length > 0 ? (
            recent.map((r, idx) => (
              <div
                key={r.id}
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  borderTop: idx === 0 ? 'none' : '1px solid rgba(15,23,42,0.06)',
                }}
              >
                <div className="min-w-0 mr-3">
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {r.course?.name ?? 'Unknown course'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {format(new Date(r.play_date), 'EEE d MMM')}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[16px] font-bold text-foreground tabular-nums">
                    {r.adjusted_gross ?? '—'}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium tabular-nums"
                    style={{ background: 'rgba(15,23,42,0.05)', color: 'rgba(15,23,42,0.78)' }}
                  >
                    {r.is_counter && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#10B981' }}
                      />
                    )}
                    {fmtDiff(r.handicap_differential)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 text-[14px] text-muted-foreground">No rounds yet.</p>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <div className="px-5 pt-2 flex flex-col items-center gap-3">
        <p className="text-[12px] text-muted-foreground">
          {lastSyncedAt
            ? `Last refreshed ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`
            : 'Not yet synced'}
        </p>
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold disabled:opacity-50"
          style={{ color: '#F7931E' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </button>
        <button
          onClick={() =>
            toast(
              'Disconnect coming soon — get in touch via support if you need to disconnect now.'
            )
          }
          className="text-[12px] text-muted-foreground mt-2"
        >
          Disconnect England Golf
        </button>
      </div>
    </div>
  );
};

export default HandicapDashboard;
