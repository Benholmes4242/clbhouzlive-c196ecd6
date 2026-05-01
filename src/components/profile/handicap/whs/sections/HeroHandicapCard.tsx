import React from 'react';
import { format } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useHandicapHistory, useHandicapTrend } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
}

type Range = 30 | 90 | 365;

const fmtDelta = (n: number) => Math.abs(n).toFixed(1);

export const HeroHandicapCard: React.FC<Props> = ({ connection }) => {
  const [range, setRange] = React.useState<Range>(90);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history, isLoading: historyLoading } = useHandicapHistory(connection.id, range);

  const memberSince = connection.created_at
    ? `Member since ${format(new Date(connection.created_at), 'MMM yyyy')}`
    : 'England Golf member';

  // Trend pill
  let trendNode: React.ReactNode = null;
  if (trend) {
    if (trend.delta === null && !trend.hasHistory) {
      trendNode = (
        <span className="text-[12px] text-muted-foreground">New connection</span>
      );
    } else if (trend.delta !== null && Math.abs(trend.delta) < 0.05) {
      trendNode = <span className="text-[12px] text-muted-foreground">No change · 30d</span>;
    } else if (trend.delta !== null && trend.delta < 0) {
      trendNode = (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
          style={{ background: 'rgba(16,185,129,0.10)', color: '#059669' }}
        >
          <ArrowDown className="h-3 w-3" /> {fmtDelta(trend.delta)} · 30d
        </span>
      );
    } else if (trend.delta !== null && trend.delta > 0) {
      trendNode = (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
          style={{ background: 'rgba(220,38,38,0.10)', color: '#B91C1C' }}
        >
          <ArrowUp className="h-3 w-3" /> {fmtDelta(trend.delta)} · 30d
        </span>
      );
    }
  }

  // Spark direction
  const points = history ?? [];
  const sparkColor = (() => {
    if (points.length < 2) return '#94A3B8';
    const first = points[0].handicap_index;
    const last = points[points.length - 1].handicap_index;
    if (Math.abs(last - first) < 0.05) return '#94A3B8';
    return last < first ? '#10B981' : '#DC2626';
  })();

  const isTrendLoading = trendLoading && !trend;

  return (
    <section className="px-5 pt-8 pb-6">
      <p className="text-[12px] text-muted-foreground mb-3">{memberSince}</p>

      {/* Index + trend */}
      <div className="flex items-end justify-between gap-3 mb-4">
        {isTrendLoading ? (
          <div className="h-16 w-28 bg-muted rounded animate-pulse" />
        ) : (
          <span
            className="font-extrabold text-foreground tabular-nums leading-none"
            style={{ fontSize: 64, letterSpacing: '-0.02em' }}
          >
            {trend?.current !== null && trend?.current !== undefined
              ? trend.current.toFixed(1)
              : '—'}
          </span>
        )}
        <div className="pb-2">{trendNode}</div>
      </div>

      <p className="text-[14px] font-medium text-muted-foreground mb-3">Handicap Index</p>

      {/* Sparkline */}
      <div className="mb-4" style={{ height: 90 }}>
        {historyLoading ? (
          <div className="w-full h-full bg-muted/40 rounded-md animate-pulse" />
        ) : points.length === 0 ? (
          <div className="flex items-center h-full">
            <p className="text-[12px] text-muted-foreground">
              Snapshots will populate as your handicap changes.
            </p>
          </div>
        ) : points.length === 1 ? (
          <div className="flex items-center h-full">
            <div
              className="h-px w-full opacity-40"
              style={{ background: sparkColor }}
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 6, right: 4, bottom: 6, left: 4 }}
            >
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['auto', 'auto']} />
              <Line
                type="monotone"
                dataKey="handicap_index"
                stroke={sparkColor}
                strokeWidth={2.25}
                dot={false}
                isAnimationActive={true}
                animationDuration={300}
                fill="url(#sparkFill)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Range toggle */}
      <div className="inline-flex rounded-full p-0.5" style={{ background: 'rgba(15,23,42,0.05)' }}>
        {([30, 90, 365] as Range[]).map((r) => {
          const active = r === range;
          return (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 rounded-full text-[12px] font-semibold transition-colors"
              style={{
                background: active ? '#0F172A' : 'transparent',
                color: active ? '#FFFFFF' : '#64748B',
              }}
            >
              {r === 365 ? '1y' : `${r}d`}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default HeroHandicapCard;
