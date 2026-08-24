import React from 'react';
import { Radio, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import AdminErrorState from './AdminErrorState';
import {
  CARD, KICKER, LABEL, FIG, Skeleton, num, monotonePath, useElementWidth, EndDot,
  AxisTicks, fourTickIndices,
} from '../lib/chartPrimitives';
import type { TopActiveUser } from '../hooks/useDashboard';
import type { Retention } from '../hooks/useRetention';

const HAIRLINE = `1px solid ${t.hairline}`;

/** Scale into a 0-100 x by H y viewBox. Null values break the line. */
function segments(values: (number | null)[], maxY: number, H: number, pad = 3) {
  const n = values.length;
  const innerH = H - pad * 2;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * 100);
  const y = (v: number) => pad + innerH - (maxY <= 0 ? 0 : (v / maxY) * innerH);
  const out: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  values.forEach((v, i) => {
    if (v === null || v === undefined) {
      if (cur.length) out.push(cur);
      cur = [];
    } else {
      cur.push({ x: x(i), y: y(v) });
    }
  });
  if (cur.length) out.push(cur);
  return { segs: out, x, y };
}

// ─── 4 RIGHT NOW ──────────────────────────────────────────────────────────────

export function RightNowPanel({
  live, liveLoading, intraday, intradayLoading, topUsers, topUsersLoading,
}: {
  live: number | null; liveLoading: boolean;
  intraday: { hour: number; today: number | null; last: number | null }[];
  intradayLoading: boolean;
  topUsers: TopActiveUser[] | undefined;
  topUsersLoading: boolean;
}) {
  const H = 44;
  const CHART_PX = 120;
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const todayVals = intraday.map(p => p.today);
  const lastVals = intraday.map(p => p.last);
  const peakToday = todayVals.reduce<number>((m, v) => (v != null && v > m ? v : m), 0);
  const maxY = Math.max(1, peakToday, lastVals.reduce<number>((m, v) => (v != null && v > m ? v : m), 0));

  const today = segments(todayVals, maxY, H);
  const last = segments(lastVals, maxY, H);
  const lastTodaySeg = today.segs[today.segs.length - 1];
  const endPt = lastTodaySeg?.[lastTodaySeg.length - 1];

  const areaPath = lastTodaySeg && lastTodaySeg.length > 1
    ? `${monotonePath(lastTodaySeg)} L${lastTodaySeg[lastTodaySeg.length - 1].x.toFixed(2)},${H} L${lastTodaySeg[0].x.toFixed(2)},${H} Z`
    : '';

  const tickIdx = fourTickIndices(intraday.length);
  const tickLabels = tickIdx.map(i => `${intraday[i]?.hour ?? 0}h`);

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{
          width: 8, height: 8, borderRadius: 999, background: t.ok,
          animation: 'admin-pulse-dot 1.6s ease-in-out infinite', flexShrink: 0,
        }} />
        <span style={KICKER}>Right now</span>
        <span style={{ flex: 1 }} />
        {/* Carries the scale, which is why there is no y axis at all. */}
        {!intradayLoading && intraday.length > 1 ? (
          <span style={{ ...LABEL, ...FIG }}>Peak today {num(peakToday)}</span>
        ) : null}
        <Radio size={14} color={t.inkFaint} />
        {/* Real link, not a div with onClick: focusable and announced. */}
        <Link
          to="/admin-v2/analytics?tab=live"
          aria-label="Open live analytics"
          style={{ display: 'inline-flex', color: t.inkFaint, textDecoration: 'none' }}
        >
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>

      {liveLoading ? (
        <Skeleton height={32} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ ...FIG, color: t.ink, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
            {num(live ?? 0)}
          </span>
          <span style={{ color: t.inkMuted, fontSize: 13, fontWeight: 500 }}>
            member{(live ?? 0) === 1 ? '' : 's'} active in last 5 min
          </span>
        </div>
      )}

      {intradayLoading ? (
        <Skeleton height={CHART_PX} />
      ) : intraday.length < 2 ? (
        <div style={{ color: t.inkFaint, fontSize: 12 }}>Not enough data yet</div>
      ) : (
        <div>
          <div ref={ref} style={{ position: 'relative', height: CHART_PX }}>
            <svg width="100%" height={CHART_PX} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
              {areaPath ? <path d={areaPath} fill={t.ink} fillOpacity={0.10} stroke="none" /> : null}
              {last.segs.map((s, i) => (
                <path key={`l${i}`} d={monotonePath(s)} fill="none" stroke={t.inkFaint} strokeWidth={1.25}
                  strokeDasharray="3 3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              ))}
              {today.segs.map((s, i) => (
                <path key={`t${i}`} d={monotonePath(s)} fill="none" stroke={t.ink} strokeWidth={2}
                  vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>
            {endPt && width > 0 ? (
              <EndDot left={(endPt.x / 100) * width} top={(endPt.y / H) * CHART_PX} color={t.ink} />
            ) : null}
          </div>
          <AxisTicks labels={tickLabels} />
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <span style={{ ...LABEL, color: t.ink, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden style={{ width: 14, height: 2, background: t.ink, borderRadius: 999 }} />
              Today
            </span>
            <span style={{ ...LABEL, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden style={{ width: 14, height: 0, borderTop: `2px dashed ${t.inkFaint}` }} />
              Last week
            </span>
          </div>
        </div>
      )}

      {/* 4f BUSIEST TODAY. Zero users renders nothing at all - the day may
          simply be young, and that is not an empty state. */}
      {topUsersLoading ? (
        <Skeleton height={64} />
      ) : topUsers && topUsers.length > 0 ? (
        <div style={{ borderTop: HAIRLINE, paddingTop: 6 }}>
          <div style={{ ...LABEL, paddingTop: 4 }}>Busiest today</div>
          {topUsers.slice(0, 3).map(u => (
            <Link
              key={u.userId}
              to={`/admin-v2/users?member=${u.userId}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', textDecoration: 'none', color: 'inherit' }}
            >
              {/* ALWAYS render the avatar: SquircleAvatar draws deterministic
                  initials on a null src, and it occupies the 20px slot either
                  way, so rows still align. */}
              <SquircleAvatar src={u.avatarUrl} alt={u.displayName} size={20} hairlineRing />

              <span style={{ color: t.ink, fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.displayName}
              </span>
              <span style={{ ...FIG, color: t.ink, fontSize: 13, fontWeight: 700 }}>{num(u.eventCount)}</span>
              <ChevronRight size={14} color={t.inkFaint} aria-hidden />
            </Link>
          ))}
          <div style={LABEL}>events since midnight</div>
        </div>
      ) : null}
    </section>
  );
}

// ─── 6 RETENTION ──────────────────────────────────────────────────────────────

/**
 * DAU 8 says nothing about whether it is the same 8 people every day. Every
 * figure carries its reference point: a bare 40% over a 5-member cohort is a
 * lie of omission.
 */
export function RetentionPanel({ data, loading }: { data?: Retention; loading: boolean }) {
  const c = data?.cohort;
  const cols: { label: string; returned: number; eligible: number }[] = c ? [
    { label: 'D1', returned: c.d1_returned, eligible: c.d1_eligible },
    { label: 'D7', returned: c.d7_returned, eligible: c.d7_eligible },
    { label: 'D30', returned: c.d30_returned, eligible: c.d30_eligible },
  ] : [];

  const daily = data?.daily ?? [];
  const maxDay = daily.reduce((m, d) => Math.max(m, (d.returning ?? 0) + (d['new'] ?? 0)), 0);

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={KICKER}>Retention</span>
        <span style={{ flex: 1 }} />
        {data ? <span style={{ ...LABEL, ...FIG }}>Last {daily.length}d</span> : null}
        <Link
          to="/admin-v2/analytics?tab=overview"
          aria-label="Open retention in analytics"
          style={{ display: 'inline-flex', color: t.inkFaint, textDecoration: 'none' }}
        >
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>

      {loading || !c ? (
        <Skeleton height={120} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {cols.map(col => (
              <div key={col.label}>
                <div style={LABEL}>{col.label}</div>
                {/* eligible 0 renders nothing: no 0%, no dash, no n/a. */}
                {col.eligible > 0 ? (
                  <>
                    <div style={{ ...FIG, color: t.ink, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 2 }}>
                      {Math.round((col.returned / col.eligible) * 100)}%
                    </div>
                    <div style={{ ...LABEL, ...FIG, marginTop: 1 }}>
                      {num(col.returned)} of {num(col.eligible)}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          {daily.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 72 }}>
                {daily.map(d => {
                  const ret = d.returning ?? 0;
                  const nw = d['new'] ?? 0;
                  const total = ret + nw;
                  const h = maxDay > 0 ? (total / maxDay) * 72 : 0;
                  const retH = total > 0 ? (ret / total) * h : 0;
                  return (
                    // A zero day is an empty column, not a missing one: the
                    // spacing must stay even or the shape lies.
                    <div key={d.date} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{
                        height: Math.max(0, h - retH), background: t.ink, opacity: 0.35,
                        borderRadius: '3px 3px 0 0',
                      }} />
                      <div style={{
                        height: retH, background: t.ink,
                        borderRadius: nw > 0 ? '0 0 1px 1px' : '3px 3px 1px 1px',
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                <span style={{ ...LABEL, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: t.ink }} />
                  Returning
                </span>
                <span style={{ ...LABEL, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: t.ink, opacity: 0.35 }} />
                  New
                </span>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

// ─── 7 ACTIVE MEMBERS ─────────────────────────────────────────────────────────

/**
 * Plots the ROLLING WEEKLY active count - WAU - not daily actives: the DAU
 * tile sparklines the daily series, and one series charted twice on one page
 * is a duplication. Avg / Peak / Low describe the WAU series.
 */
export function ActiveMembersPanel({
  data, stickiness, loading, isError, onRetry,
}: {
  data: { date: string; wau: number }[];
  /** WAU as a share of MAU. null renders nothing. */
  stickiness: number | null;
  loading: boolean; isError: boolean; onRetry: () => void;
}) {
  const H = 44;
  const CHART_PX = 160;
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const vals = data.map(d => d.wau);
  const peak = vals.length ? Math.max(...vals) : 0;
  const low = vals.length ? Math.min(...vals) : 0;
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const maxY = Math.max(1, peak);

  const { segs } = segments(vals, maxY, H);
  const seg = segs[0] ?? [];
  const endPt = seg[seg.length - 1];
  const areaPath = seg.length > 1
    ? `${monotonePath(seg)} L${seg[seg.length - 1].x.toFixed(2)},${H} L${seg[0].x.toFixed(2)},${H} Z`
    : '';

  const tickIdx = fourTickIndices(data.length);
  const tickLabels = tickIdx.map(i =>
    data[i] ? new Date(data[i].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={KICKER}>Active members</span>
        <span style={{ flex: 1 }} />
        {stickiness !== null ? (
          <span style={{ ...LABEL, ...FIG }}>{stickiness}% weekly of monthly</span>
        ) : null}
        <span style={{ ...LABEL, ...FIG }}>Last 28d</span>
        <Link
          to="/admin-v2/analytics?tab=overview"
          aria-label="Open active members in analytics"
          style={{ display: 'inline-flex', color: t.inkFaint, textDecoration: 'none' }}
        >
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>

      {loading ? (
        <Skeleton height={200} />
      ) : isError ? (
        <AdminErrorState message="Couldn't load active members." onRetry={onRetry} />
      ) : (
        <>
          {/* The emphasised element carries its own value: nothing has to be
              read off an axis, so there is no y axis and no legend. */}
          <div style={{ display: 'flex', gap: 24 }}>
            {([
              ['Avg', avg.toFixed(1)],
              ['Peak', num(peak)],
              ['Low', num(low)],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <div style={LABEL}>{label}</div>
                <div style={{ ...FIG, color: t.ink, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 2 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div ref={ref} style={{ position: 'relative', height: CHART_PX }}>
              <svg width="100%" height={CHART_PX} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
                {areaPath ? <path d={areaPath} fill={t.ink} fillOpacity={0.10} stroke="none" /> : null}
                {seg.length > 1 ? (
                  <path d={monotonePath(seg)} fill="none" stroke={t.ink} strokeWidth={2}
                    vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
              </svg>
              {endPt && width > 0 ? (
                <EndDot left={(endPt.x / 100) * width} top={(endPt.y / H) * CHART_PX} color={t.ink} />
              ) : null}
            </div>
            <AxisTicks labels={tickLabels} />
          </div>
        </>
      )}
    </section>
  );
}
