import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowDown, ArrowUp, Trophy, Flame } from 'lucide-react';
import {
  useHandicapHistory,
  useHandicapTrend,
  useCounters,
  useRecentRounds,
} from '@/lib/whs/hooks';
import type { WhsConnection, HandicapPoint } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
}

type Range = 30 | 90 | 365;

const fmtDelta = (n: number) => Math.abs(n).toFixed(1);

const HAIRLINE = '1px solid rgba(15,23,42,0.10)';

// ── Career-low detection ──────────────────────────────────────────────────
function useCareerLowBadge(
  currentValue: number | null | undefined,
  yearHistory: HandicapPoint[] | undefined,
): string | null {
  return useMemo(() => {
    if (currentValue === null || currentValue === undefined) return null;
    if (!yearHistory || yearHistory.length === 0) return null;

    const min = yearHistory.reduce(
      (acc, p) =>
        p.handicap_index < acc.value
          ? { value: p.handicap_index, at: p.observed_at }
          : acc,
      { value: Infinity, at: '' },
    );
    if (min.value === Infinity) return null;
    if (Math.abs(min.value - currentValue) > 0.05) return null;

    const observed = new Date(min.at).getTime();
    const now = Date.now();
    const days = Math.floor((now - observed) / 86_400_000);
    if (days < 0 || days > 30) return null;
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    return `${days} DAYS AGO`;
  }, [currentValue, yearHistory]);
}

// ── Weekly streak computation ─────────────────────────────────────────────
function isoWeek(d: Date): string {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const week1 = new Date(t.getFullYear(), 0, 4);
  const wk =
    1 +
    Math.round(
      ((t.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${t.getFullYear()}-W${wk.toString().padStart(2, '0')}`;
}

function useWeeklyStreak(connectionId: string | undefined): number {
  const { data: recent } = useRecentRounds(connectionId);
  return useMemo(() => {
    if (!recent || recent.length === 0) return 0;
    const weekSet = new Set<string>();
    for (const r of recent) {
      if (r.play_date) weekSet.add(isoWeek(new Date(r.play_date)));
    }
    const weeks = Array.from(weekSet).sort().reverse();
    if (weeks.length === 0) return 0;

    const thisWeek = isoWeek(new Date());
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = isoWeek(lastWeekDate);

    if (weeks[0] !== thisWeek && weeks[0] !== lastWeek) return 0;

    let streak = 1;
    for (let i = 1; i < weeks.length; i++) {
      const prevWeekStr = weeks[i - 1];
      const [yearStr, weekPart] = prevWeekStr.split('-W');
      const year = parseInt(yearStr, 10);
      const wk = parseInt(weekPart, 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = (jan4.getDay() + 6) % 7;
      const week1Mon = new Date(jan4.getTime() - dayOfWeek * 86400000);
      const targetMon = new Date(week1Mon.getTime() + (wk - 1) * 7 * 86400000);
      const expectedPrev = isoWeek(
        new Date(targetMon.getTime() - 7 * 86400000),
      );
      if (weeks[i] === expectedPrev) streak++;
      else break;
    }
    return streak;
  }, [recent]);
}

// ── Counting rounds ───────────────────────────────────────────────────────
function useCountingRounds(connectionId: string | undefined): {
  used: number;
  max: number;
} {
  const { data: counters } = useCounters(connectionId);
  return useMemo(() => {
    if (!counters) return { used: 0, max: 8 };
    const used = counters.filter((c) => c.handicap_differential !== null).length;
    return { used, max: 8 };
  }, [counters]);
}

export const HeroHandicapCard: React.FC<Props> = ({ connection }) => {
  const [range, setRange] = React.useState<Range>(90);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history, isLoading: historyLoading } = useHandicapHistory(
    connection.id,
    range,
  );
  const { data: yearHistory } = useHandicapHistory(connection.id, 365);

  const counting = useCountingRounds(connection.id);
  const streak = useWeeklyStreak(connection.id);
  const careerLowLabel = useCareerLowBadge(trend?.current, yearHistory);

  const isTrendLoading = trendLoading && !trend;

  // Trend rendering — arrow + delta inline
  let trendNode: React.ReactNode = null;
  if (trend && trend.delta !== null && Math.abs(trend.delta) >= 0.05) {
    const isImprovement = trend.delta < 0;
    const Arrow = isImprovement ? ArrowDown : ArrowUp;
    const color = isImprovement ? '#059669' : '#9F1D1D';
    trendNode = (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color,
          paddingBottom: 10,
        }}
      >
        <Arrow size={16} strokeWidth={2.5} />
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            fontFamily: 'system-ui, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {fmtDelta(trend.delta)}
        </span>
      </span>
    );
  }

  // Career low value (for stat strip column 3)
  const careerLowValue = useMemo(() => {
    if (!yearHistory || yearHistory.length === 0) return null;
    const min = yearHistory.reduce(
      (acc, p) => (p.handicap_index < acc ? p.handicap_index : acc),
      Infinity,
    );
    return min === Infinity ? null : min;
  }, [yearHistory]);

  // Spark colour
  const points = history ?? [];
  const sparkColor = (() => {
    if (points.length < 2) return '#94A3B8';
    const first = points[0].handicap_index;
    const last = points[points.length - 1].handicap_index;
    if (Math.abs(last - first) < 0.05) return '#94A3B8';
    return last < first ? '#059669' : '#9F1D1D';
  })();

  return (
    <section style={{ padding: '24px 20px' }}>
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 3,
            height: 8,
            borderRadius: 1,
            background: '#F7931E',
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#F7931E',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Your Handicap Index
        </span>
      </div>

      {/* Big number + delta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          marginBottom: careerLowLabel ? 10 : 14,
        }}
      >
        {isTrendLoading ? (
          <div
            style={{
              height: 64,
              width: 120,
              borderRadius: 6,
              background: 'rgba(247,147,30,0.12)',
            }}
            className="animate-pulse"
          />
        ) : (
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
              color: '#F7931E',
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {trend?.current !== null && trend?.current !== undefined
              ? trend.current.toFixed(1)
              : '—'}
          </span>
        )}
        {trendNode}
      </div>

      {/* Conditional career-low badge */}
      {careerLowLabel && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 14,
          }}
        >
          <Trophy size={11} fill="#B45309" stroke="#B45309" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#B45309',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
            }}
          >
            New Career Low · {careerLowLabel}
          </span>
        </div>
      )}

      {/* Stat strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: HAIRLINE,
          borderBottom: HAIRLINE,
          marginBottom: 18,
        }}
      >
        {/* Counting */}
        <div
          style={{
            padding: '12px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                fontFamily: 'Georgia, serif',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: '#0F172A',
                lineHeight: 1,
              }}
            >
              {counting.used}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#94A3B8',
                lineHeight: 1,
              }}
            >
              / {counting.max}
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            Counting
          </div>
        </div>

        {/* Streak */}
        <div
          style={{
            padding: '12px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: HAIRLINE,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <Flame
              size={11}
              fill="#F7931E"
              stroke="#F7931E"
              style={{ position: 'relative', top: 1 }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                fontFamily: 'Georgia, serif',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: '#0F172A',
                lineHeight: 1,
              }}
            >
              {streak}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#94A3B8',
                lineHeight: 1,
              }}
            >
              w
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            Streak
          </div>
        </div>

        {/* Career low (Brief 1 fallback for friend rank) */}
        <div
          style={{
            padding: '12px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: HAIRLINE,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                fontFamily: 'Georgia, serif',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: '#0F172A',
                lineHeight: 1,
              }}
            >
              {careerLowValue !== null ? careerLowValue.toFixed(1) : '—'}
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            Career low
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ height: 90, marginBottom: 12 }}>
        {historyLoading ? (
          <div className="w-full h-full bg-muted/40 rounded-md animate-pulse" />
        ) : points.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
              Snapshots will populate as your handicap changes.
            </p>
          </div>
        ) : points.length === 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <div
              style={{ height: 1, width: '100%', opacity: 0.4, background: sparkColor }}
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
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
      <div
        style={{
          display: 'inline-flex',
          padding: 2,
          borderRadius: 999,
          background: 'rgba(15,23,42,0.04)',
        }}
      >
        {([30, 90, 365] as Range[]).map((r) => {
          const active = r === range;
          return (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: active ? '#F7931E' : 'transparent',
                color: active ? '#fff' : '#64748B',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
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
