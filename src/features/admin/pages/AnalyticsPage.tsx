import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Search, XCircle } from 'lucide-react';
import { adminTheme as t } from '../theme';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import AdminErrorState from '../components/AdminErrorState';
import AdminSheet from '../components/AdminSheet';
import { labelForEvent } from '../lib/eventLabels';
import { useLiveInApp, useOverviewMetrics, type MetricsBundle } from '../hooks/useOverviewMetrics';
import { useOpsHealth, type OpsHealth } from '../hooks/useOpsHealth';
import { useActiveWindows, type ActiveWindows } from '../hooks/useActiveWindows';
import { useScreenAnalytics, type ScreenRow } from '../hooks/useScreenAnalytics';
import { useFunnelCohorts, nestingFaults, type FunnelCohorts } from '../hooks/useFunnelCohorts';
import { useMemberActions, humaniseActionName, type MemberActions } from '../hooks/useMemberActions';
import { monotonePath, useElementWidth, EndDot, AxisTicks, fourTickIndices } from '../lib/chartPrimitives';
import { useLiveWindow30m, useProfilesByIds, type LiveEventRow, type LiteProfile } from '../hooks/useLiveStream';
import {
  useEventAggregates,
  useRecentOccurrences,
  dailyForEvent,
  type EventAggregate,
} from '../hooks/useEventsExplorer';
import {
  AnalyticsPeriod,
  periodToDays,
  usePlatformAnalytics,
  useEngagementAnalytics,
  useGrowthAnalytics,
  useContentAnalytics,
  useAuthAnalytics,
} from '../hooks/useAnalytics';
import { useFunnels } from '../hooks/useFunnels';
import FunnelCard from '../components/FunnelCard';
import AudiencesSection from '../components/AudiencesSection';
import PostInsightSheet from '../components/PostInsightSheet';
import CourseInsightSheet from '../components/CourseInsightSheet';
import { useTopContent } from '../hooks/useTopContent';
import ScreensTab from '../components/ScreensTab';


type TabId = 'overview' | 'growth' | 'engagement' | 'screens' | 'funnels' | 'live' | 'events' | 'auth';

/**
 * The RAIL. Six tabs, in argument order: activation, growth, engagement,
 * screens, funnels, then Live last - Live is an ops view, not analytics.
 *
 * `events` and `auth` are DIAGNOSTICS and are deliberately absent from the
 * rail while staying reachable by ?tab=. They belong under System; that move
 * has not been briefed, so nothing is deleted.
 */
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'growth',     label: 'Growth' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'screens',    label: 'Screens' },
  { id: 'funnels',    label: 'Funnels' },
  { id: 'live',       label: 'Live' },
];

const ALL_TAB_IDS: TabId[] = [
  'overview', 'growth', 'engagement', 'screens', 'funnels', 'live', 'events', 'auth',
];

const PERIODS: AnalyticsPeriod[] = ['7d', '30d', '90d'];
const ALL_PERIODS: AnalyticsPeriod[] = ['7d', '14d', '30d', '90d'];

const isTab = (v: string | null): v is TabId =>
  !!v && (ALL_TAB_IDS as string[]).includes(v);
const isPeriod = (p: string | null): p is AnalyticsPeriod =>
  !!p && (ALL_PERIODS as string[]).includes(p);

// Legacy ?view= mapping (D5 rename) so old links keep working. Retention has
// folded into Overview's cohort grid, so it redirects rather than 404s.
function legacyViewToTab(v: string | null): TabId | null {
  if (!v) return null;
  if (v === 'retention') return 'overview';
  if (v === 'growth' || v === 'engagement' || v === 'auth') return v;
  if (v === 'platform' || v === 'content') return 'engagement';
  return null;
}


export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams();

  const tabParam = params.get('tab');
  const viewParam = params.get('view');
  // ?tab=retention lands on Overview - the cohort grid moved there.
  const tab: TabId = tabParam === 'retention'
    ? 'overview'
    : isTab(tabParam)
      ? tabParam
      : legacyViewToTab(viewParam) ?? legacyViewToTab(tabParam) ?? 'overview';
  const period: AnalyticsPeriod = isPeriod(params.get('period')) ? (params.get('period') as AnalyticsPeriod) : '30d';
  const showPeriodSelector = tab !== 'live' && tab !== 'overview';


  const setTab = (v: TabId) => {
    const next = new URLSearchParams(params);
    next.set('tab', v);
    next.delete('view');
    if (!next.get('period')) next.set('period', period);
    setParams(next, { replace: true });
  };
  const setPeriod = (p: AnalyticsPeriod) => {
    const next = new URLSearchParams(params);
    next.set('period', p);
    if (!next.get('tab')) next.set('tab', tab);
    setParams(next, { replace: true });
  };

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1280, margin: '0 auto' }}>
      {/* No kicker, no heading, no refresh button: AdminShell's fixed header
          owns all three. Two of each was the Inbox fault. */}
      {showPeriodSelector && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{
            display: 'inline-flex', border: `1px solid ${t.line}`, borderRadius: 999,
            background: t.surface, padding: 2,
          }}>
            {PERIODS.map(p => {
              const active = p === period;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: active ? t.ink : 'transparent',
                    color: active ? t.canvas : t.inkMuted,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >{p}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* WRAPS, never scrolls sideways: a tab you cannot see is a tab that
          does not exist. Active state is t.ink / t.canvas - no tinted capsules. */}
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '2px 0',
        }}
      >
        {TABS.map(v => {
          const active = v.id === tab;
          return (
            <button
              key={v.id}
              onClick={() => setTab(v.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: `1px solid ${active ? 'transparent' : t.line}`,
                background: active ? t.ink : t.surface,
                color: active ? t.canvas : t.inkMuted,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {v.label}
            </button>
          );
        })}
      </nav>

      {tab === 'overview'   && <OverviewTab />}
      {tab === 'live'       && <LiveTab />}
      {tab === 'growth'     && <GrowthTab     period={period} />}
      {tab === 'engagement' && <EngagementTab period={period} />}
      {tab === 'screens'    && <ScreensTab     days={periodToDays(period)} />}
      {tab === 'funnels'    && <FunnelsTab    period={period} />}
      {/* Diagnostics, reachable by URL only until the move under System is briefed. */}
      {tab === 'events'     && <EventsTab     period={period} />}
      {tab === 'auth'       && <AuthTab       period={period} />}


      <style>{`@keyframes admin-pulse-dot { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function fmtTick(v: number) { return v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`; }
function fmtInt(n: number) { return n.toLocaleString(); }
/**
 * Returns null when the prior period is 0: "from nothing" has no percentage
 * and returning 100 made it indistinguishable from a genuine doubling.
 * Callers render null as "New". Rounded FIRST, to an INTEGER, so every delta
 * on the page carries the same precision.
 */
function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.line}`,
      borderRadius: 18,
      boxShadow: t.shadowCard,
      padding: 16,
      ...style,
    }}>{children}</div>
  );
}

/** null delta = no comparable prior period; renders "New", never a percentage. */
function DeltaChip({ delta, unit = '%' }: { delta: number | null; unit?: string }) {
  if (delta === null) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        color: t.inkMuted, background: t.neutralSoft,
        borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700,
      }}>New</span>
    );
  }
  const positive = delta >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      color: positive ? t.okText : t.dangerText,
      background: positive ? t.okSoft : t.dangerSoft,
      borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(delta)}{unit}
    </span>
  );
}


function Headline({
  eyebrow, value, delta, deltaUnit, note, loading,
}: {
  eyebrow: string;
  value: React.ReactNode;
  delta?: number | null;
  deltaUnit?: string;
  note?: string;
  loading?: boolean;
}) {
  return (
    <Card style={{ borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        color: t.inkFaint, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{eyebrow}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          color: t.ink, fontSize: 38, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {loading ? '-' : value}
        </div>
        {!loading && delta !== undefined && (
          <DeltaChip delta={delta} unit={deltaUnit ?? '%'} />
        )}

      </div>
      {note && (
        <div style={{ color: t.inkMuted, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
          {note}
        </div>
      )}
    </Card>
  );
}

function Squircle({
  src, initials, size = 34,
}: { src: string | null; initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.34),
      background: t.canvas, border: `1px solid ${t.line}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
      color: t.inkMuted, fontSize: 12, fontWeight: 700,
    }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  );
}

function AreaTrend({ data, height = 220 }: { data: { date: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="aa-brand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
            <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="value" stroke={t.brand} strokeWidth={1.8} fill="url(#aa-brand)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BarTrend({
  data, xKey = 'date', color = t.brand, height = 220,
}: { data: any[]; xKey?: string; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Growth ───────────────────────────────────────────────────────────────────

function GrowthTab({ period }: { period: AnalyticsPeriod }) {
  const platform = usePlatformAnalytics(period);
  const growth   = useGrowthAnalytics(period);
  const isLoading = platform.isLoading || growth.isLoading;

  const signups = growth.data?.signupsThisPeriod ?? 0;
  const prior   = growth.data?.signupsPriorPeriod ?? 0;
  const delta   = typeof prior === 'number' ? pctDelta(signups, prior) : undefined;

  // Cumulative members: running total from period start.
  const cumulative = useMemo(() => {
    if (!platform.data) return [];
    const trend = platform.data.signupTrend;
    const periodTotal = trend.reduce((a, b) => a + b.value, 0);
    const startMembers = Math.max(0, (platform.data.totalUsers ?? 0) - periodTotal);
    let running = startMembers;
    return trend.map(d => {
      running += d.value;
      return { date: d.date, value: running };
    });
  }, [platform.data]);

  const geo = growth.data?.geo ?? [];
  const geoTop = geo.slice(0, 8);
  const geoMax = geoTop.reduce((m, g) => Math.max(m, g.userCount), 0) || 1;

  const trendEmpty = !isLoading && !(platform.data?.signupTrend?.some(d => d.value > 0));

  return (
    <>
      <Headline
        eyebrow="Signups in period"
        value={fmtInt(signups)}
        delta={delta}

        note={`vs ${fmtInt(prior)} in the prior period`}
        loading={isLoading}
      />

      <ChartCard title="Daily signups" subtitle={`Signups per day, last ${period}`} loading={isLoading} isEmpty={trendEmpty}
        dataTable={(platform.data?.signupTrend ?? []).map(d => ({ label: d.date, value: d.value }))}>
        <BarTrend data={platform.data?.signupTrend ?? []} />
      </ChartCard>

      <ChartCard title="Members over time" subtitle={`Cumulative member count across the period`} loading={isLoading} isEmpty={cumulative.length === 0}
        dataTable={cumulative.map(d => ({ label: d.date, value: d.value }))}>
        <AreaTrend data={cumulative} />
      </ChartCard>

      <Card>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Where members are</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Top 8 countries by member count</div>
        {isLoading ? (
          <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md }} />
        ) : geoTop.length === 0 ? (
          <EmptyState title="No geo data yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {geoTop.map(g => {
              const pct = (g.userCount / geoMax) * 100;
              return (
                <div key={g.country} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: t.ink, fontWeight: 600 }}>{g.country}</span>
                    <span style={{ color: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(g.userCount)}</span>
                  </div>
                  <div style={{ height: 8, background: t.canvas, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: t.brand }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AudiencesSection />
    </>
  );
}


// ─── Engagement ───────────────────────────────────────────────────────────────

function EngagementTab({ period }: { period: AnalyticsPeriod }) {
  const platform = usePlatformAnalytics(period);
  const eng      = useEngagementAnalytics(period);
  const content  = useContentAnalytics(period);
  const isLoading = platform.isLoading || eng.isLoading;

  const avgDau = platform.data?.avgDau ?? 0;
  const peak = platform.data?.peakDau ?? 0;
  const wau = platform.data?.wau ?? 0;
  const mau = platform.data?.mau ?? 0;
  const stickiness = platform.data?.dauMauRatio ?? 0;

  const combined = useMemo(() => {
    if (!content.data) return [];
    const map = new Map<string, { date: string; posts: number; reviews: number }>();
    for (const p of content.data.postsTrend) map.set(p.date, { date: p.date, posts: p.value, reviews: 0 });
    for (const r of content.data.reviewsTrend) {
      const row = map.get(r.date);
      if (row) row.reviews = r.value;
      else map.set(r.date, { date: r.date, posts: 0, reviews: r.value });
    }
    return Array.from(map.values());
  }, [content.data]);

  const topUsers = eng.data?.topActiveUsers ?? [];

  return (
    <>
      <Headline
        eyebrow="Average DAU"
        value={fmtInt(avgDau)}
        note={`Peak ${fmtInt(peak)} - WAU ${fmtInt(wau)} - MAU ${fmtInt(mau)} - stickiness ${stickiness}%`}
        loading={isLoading}
      />

      <ChartCard title="Daily active users" subtitle={`Unique active users, last ${period}`} loading={isLoading}
        isEmpty={!isLoading && !platform.data?.dau?.some(d => d.value > 0)}
        dataTable={(platform.data?.dau ?? []).map(d => ({ label: d.date, value: d.value }))}>
        <AreaTrend data={platform.data?.dau ?? []} />
      </ChartCard>

      <ChartCard title="Daily event volume" loading={isLoading}
        isEmpty={!isLoading && (!eng.data || eng.data.totalEvents === 0)}
        dataTable={(eng.data?.dailyTrend ?? []).map(d => ({ label: d.date, value: d.value }))}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={eng.data?.dailyTrend ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
            <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill={t.ink} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Busy hours" subtitle="Events by hour of day" loading={isLoading}
        isEmpty={!isLoading && (!eng.data || eng.data.totalEvents === 0)}
        dataTable={(eng.data?.hourlyBreakdown ?? []).map(h => ({ label: `${h.hour}:00`, value: h.count }))}>
        <BarTrend data={(eng.data?.hourlyBreakdown ?? []).map(h => ({ date: `${h.hour}`, value: h.count }))} />
      </ChartCard>

      <ChartCard title="Posts and reviews" subtitle="Posts (brand) and reviews (ink)" loading={content.isLoading}
        isEmpty={!content.isLoading && combined.every(d => d.posts === 0 && d.reviews === 0)}
        dataTable={combined.map(d => ({ label: d.date, value: `${d.posts} / ${d.reviews}` }))}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={combined} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
            <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="posts"   stackId="a" fill={t.brand} radius={[0, 0, 0, 0]} />
            <Bar dataKey="reviews" stackId="a" fill={t.ink}   radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* C4-4: Top content */}
      <TopContentSection period={period} />

      <Card>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Most active members</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Top 10 members by event count this period</div>
        {isLoading ? (
          <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md }} />
        ) : topUsers.length === 0 ? (
          <EmptyState title="No active members yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topUsers.map((u, i) => {
              const name = u.displayName || u.username || 'Unknown';
              const initials = (name[0] ?? '?').toUpperCase();
              const isLast = i === topUsers.length - 1;
              return (
                <Link
                  key={u.id}
                  to={`/admin-v2/users?member=${u.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0', textDecoration: 'none',
                    borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                  }}
                >
                  <span style={{
                    minWidth: 22, color: t.inkFaint, fontSize: 12, fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                  }}>{i + 1}</span>
                  <Squircle src={u.avatarUrl} initials={initials} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.ink, fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    {u.username && (
                      <div style={{ color: t.inkFaint, fontSize: 11.5 }}>@{u.username}</div>
                    )}
                  </div>
                  <span style={{
                    color: t.inkMuted, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                  }}>{fmtInt(u.eventCount)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

// ─── Top content ──────────────────────────────────────────────────────────────

function TopContentSection({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useTopContent(period);
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [openCourse, setOpenCourse] = useState<string | null>(null);

  return (
    <Card>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Top content</div>
      <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>
        Top posts (likes + comments + shares) and top courses (views), last {period}
      </div>

      {isLoading ? (
        <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div>
            <div style={{
              color: t.inkMuted, fontSize: 11, letterSpacing: 0.4,
              textTransform: 'uppercase', fontWeight: 700, marginBottom: 6,
            }}>Posts</div>
            {!data || data.posts.length === 0 ? (
              <EmptyState title="No post engagement yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.posts.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setOpenPost(p.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 0', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                    }}
                  >
                    <span style={{
                      minWidth: 22, color: t.inkFaint, fontSize: 12, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums', textAlign: 'right', marginTop: 2,
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: t.ink, fontSize: 13.5, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.contentPreview ?? '(no text)'}
                      </div>
                      <div style={{ color: t.inkFaint, fontSize: 11.5, marginTop: 2 }}>
                        {p.authorName ?? 'A member'} - {p.likes} likes, {p.comments} comments, {p.shares} shares
                      </div>
                    </div>
                    <span style={{
                      color: t.inkMuted, fontSize: 13, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{p.score}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{
              color: t.inkMuted, fontSize: 11, letterSpacing: 0.4,
              textTransform: 'uppercase', fontWeight: 700, marginBottom: 6,
            }}>Courses</div>
            {!data || data.courses.length === 0 ? (
              <EmptyState title="No course views yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.courses.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setOpenCourse(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 0', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                    }}
                  >
                    <span style={{
                      minWidth: 22, color: t.inkFaint, fontSize: 12, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: t.ink, fontSize: 13.5, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{c.name ?? 'Unnamed course'}</div>
                    </div>
                    <span style={{
                      color: t.inkMuted, fontSize: 13, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{c.views}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PostInsightSheet postId={openPost} open={!!openPost} onClose={() => setOpenPost(null)} />
      <CourseInsightSheet courseId={openCourse} open={!!openCourse} onClose={() => setOpenCourse(null)} />
    </Card>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
//
// Six panels answering four questions IN ORDER: do they activate, do they come
// back, are we growing, what do they do. The order is the argument.

/** Brand at an alpha. brand is a hex in both themes. */
function brandAlpha(alpha: number): string {
  const hex = t.brand.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const OV_KICKER: React.CSSProperties = {
  color: t.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
};
const OV_LABEL: React.CSSProperties = {
  color: t.inkFaint, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
};
const OV_FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1',
};

/**
 * S6 SKELETON RULE. While a query is in flight the panel renders this - never a
 * zero, never an empty state. An empty state is a claim about the data.
 */
function OvSkeleton({ height }: { height: number }) {
  return (
    <div style={{
      height, background: t.canvas, borderRadius: t.radius.md,
      animation: 'admin-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

function OvPanel({
  title, subtitle, right, children,
}: {
  title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={OV_KICKER}>{title}</div>
          {subtitle && <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

export function OverviewTab() {
  const fc      = useFunnelCohorts(8);
  const windows = useActiveWindows(28);
  const metrics = useOverviewMetrics();
  const ops     = useOpsHealth(7);
  const screens = useScreenAnalytics(30);
  const actions = useMemberActions(7);

  return (
    <>
      <ActivationPanel data={fc.data ?? null} loading={fc.isLoading} />
      <ReturnPanel
        windows={windows.data ?? null}
        loading={windows.isLoading || fc.isLoading}
        totalMembers={fc.data?.funnel?.[0]?.n ?? null}
      />
      <CohortGrid data={fc.data ?? null} loading={fc.isLoading} />
      <LastSevenDays
        metrics={metrics.data ?? null}
        ops={ops.data ?? null}
        loading={metrics.isLoading || ops.isLoading}
      />
      <WhereMembersGo rows={screens.data ?? null} loading={screens.isLoading} />
      <WhatMembersDid data={actions.data ?? null} loading={actions.isLoading} />
    </>
  );
}

// ─── 2a Activation ────────────────────────────────────────────────────────────

function convTone(pct: number): string {
  if (pct < 30) return t.danger;
  if (pct < 70) return t.warn;
  return t.ok;
}

function ActivationPanel({ data, loading }: { data: FunnelCohorts | null; loading: boolean }) {
  const funnel = data?.funnel ?? [];
  const faults = useMemo(() => nestingFaults(funnel), [funnel]);
  const base = funnel[0]?.n ?? 0;

  const signedUp = funnel.find(s => s.key === 'signed_up')?.n ?? base;
  const connected = funnel.find(s => s.key === 'connected')?.n ?? null;
  const unconnected = connected === null ? null : Math.max(0, signedUp - connected);

  return (
    <OvPanel title="Activation" subtitle="Every member, and how far they get">
      {loading || !data ? (
        <OvSkeleton height={220} />
      ) : funnel.length === 0 ? (
        <EmptyState title="No funnel data" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnel.map((s, i) => {
              // Width is a share of STEP 1, so the shape is the funnel. Never
              // clamped against the parent: a bar wider than its parent is a
              // data fault and must be visible, not laundered.
              const width = base > 0 ? (s.n / base) * 100 : 0;
              const prev = i > 0 ? funnel[i - 1].n : null;
              const conv = prev && prev > 0 ? Math.round((s.n / prev) * 100) : null;
              const isGate = s.key === 'connected';
              return (
                <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{
                      color: isGate ? t.ink : t.inkMuted,
                      fontSize: 13, fontWeight: isGate ? 700 : 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{s.label}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
                      <span style={{ color: t.ink, fontSize: 15, fontWeight: 700, ...OV_FIG }}>{fmtInt(s.n)}</span>
                      {conv !== null && (
                        <span style={{ color: convTone(conv), fontSize: 12, fontWeight: 700, ...OV_FIG }}>
                          {conv}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ height: 10, background: t.canvas, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${width}%`, height: '100%', borderRadius: 999,
                      background: isGate ? t.brand : brandAlpha(0.45),
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: t.hairline, margin: '2px 0' }} />

          {unconnected !== null && (
            <div style={{ color: t.inkMuted, fontSize: 12.5, lineHeight: 1.5, ...OV_FIG }}>
              {fmtInt(unconnected)} members have never connected a handicap. For them the product has
              no rounds, no scorecards and no entry to the stat browse.
            </div>
          )}

          {/*
            The BRANCH, not a fifth step. A plain figure, deliberately not a
            bar: any bar in this panel would read as another rung at a glance,
            and this is a sibling of the last step with its own denominator.
            The parent is NAMED from of_key - the client does not decide which
            step it hangs off.
          */}
          {data.branch && data.branch.of_n > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>{data.branch.label}</div>
                <div style={{ ...OV_LABEL, ...OV_FIG }}>
                  {fmtInt(data.branch.n)} of {fmtInt(data.branch.of_n)} who{' '}
                  {(funnel.find(s => s.key === data.branch!.of_key)?.label ?? data.branch.of_key).toLowerCase()}
                </div>
              </div>
              <span style={{ color: t.ink, fontSize: 17, fontWeight: 700, flexShrink: 0, ...OV_FIG }}>
                {Math.round((data.branch.n / data.branch.of_n) * 100)}%
              </span>
            </div>
          )}


          {faults.length > 0 && (
            <div style={{ color: t.dangerText, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
              Data fault: {faults.map(f => `${f.key} (${f.n}) exceeds ${f.parentKey} (${f.parentN})`).join('; ')}.
              A funnel step cannot be wider than the one above it - the bars are drawn as returned, not clamped.
            </div>
          )}
        </>
      )}
    </OvPanel>
  );
}

// ─── 2b Return ────────────────────────────────────────────────────────────────

function ReturnPanel({
  windows, loading, totalMembers,
}: { windows: ActiveWindows | null; loading: boolean; totalMembers: number | null }) {
  const daily = windows?.daily ?? [];
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const H = 120;

  const geom = useMemo(() => {
    if (daily.length < 2) return null;
    const vals = daily.map(d => d.wau);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const pts = vals.map((v, i) => ({
      x: (i / (vals.length - 1)) * 100,
      y: 6 + (1 - (v - min) / span) * (H - 12),
    }));
    return { d: monotonePath(pts), last: pts[pts.length - 1] };
  }, [daily]);

  const share = (totalMembers && windows) ? Math.round((windows.mau.current / totalMembers) * 100) : null;

  const ticks = useMemo(() => {
    if (daily.length === 0) return [];
    return fourTickIndices(daily.length).map(i => {
      const d = new Date(daily[i].date);
      return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
    });
  }, [daily]);

  return (
    <OvPanel
      title="Return"
      subtitle="Members coming back, not just arriving"
      right={!loading && windows?.stickiness !== null && windows?.stickiness !== undefined ? (
        <span style={{ ...OV_LABEL, color: t.inkMuted, ...OV_FIG, whiteSpace: 'nowrap' }}>
          {windows.stickiness}% weekly of monthly
        </span>
      ) : undefined}
    >
      {loading || !windows ? (
        <OvSkeleton height={200} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <FigureBlock label="This week" value={fmtInt(windows.wau.current)} />
            <FigureBlock label="This month" value={fmtInt(windows.mau.current)} />
            <FigureBlock label="Of all members" value={share === null ? null : `${share}%`} />
          </div>
          <div ref={ref} style={{ position: 'relative' }}>
            {geom ? (
              <>
                <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden style={{ display: 'block' }}>
                  <path
                    d={geom.d}
                    fill="none"
                    stroke={t.brand}
                    strokeWidth={1.75}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {width > 0 && <EndDot left={(geom.last.x / 100) * width} top={geom.last.y} color={t.brand} />}
              </>
            ) : (
              <div style={{ ...OV_LABEL, color: t.inkFaint }}>Not enough days for a line yet</div>
            )}
            {ticks.length > 0 && <AxisTicks labels={ticks} />}
          </div>
        </>
      )}
    </OvPanel>
  );
}

function FigureBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={OV_LABEL}>{label}</span>
      <span style={{ color: t.ink, fontSize: 26, fontWeight: 700, lineHeight: 1, ...OV_FIG }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── 2c Weekly cohorts ────────────────────────────────────────────────────────

/** 0.08 → 0.58 brand ramp. Never called with null: a null cell is an outline. */
function cohortFill(pct: number): string {
  return brandAlpha(0.08 + Math.min(0.5, (pct / 100) * 0.5));
}

function weekLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

function CohortGrid({ data, loading }: { data: FunnelCohorts | null; loading: boolean }) {
  const cohorts = data?.cohorts ?? [];
  return (
    <OvPanel title="Weekly cohorts" subtitle="Share of each signup week active in the weeks after. No W0: it is 100% by definition.">
      {loading || !data ? (
        <OvSkeleton height={220} />
      ) : cohorts.length === 0 ? (
        <EmptyState title="No cohorts yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '108px repeat(4, minmax(0, 1fr))', gap: 4 }}>
            <span />
            {[1, 2, 3, 4].map(w => (
              <span key={w} style={{ ...OV_LABEL, textAlign: 'center' }}>W{w}</span>
            ))}
          </div>
          {cohorts.map(c => (
            <div key={c.week} style={{ display: 'grid', gridTemplateColumns: '108px repeat(4, minmax(0, 1fr))', gap: 4, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <span style={{ color: t.ink, fontSize: 12.5, fontWeight: 700, ...OV_FIG }}>{weekLabel(c.week)}</span>
                {/* A percentage over a six-member cohort is a lie of omission. */}
                <span style={{ ...OV_LABEL, ...OV_FIG }}>{fmtInt(c.size)} members</span>
              </div>
              {[0, 1, 2, 3].map(i => {
                const v = i < c.weeks.length ? c.weeks[i] : null;
                if (v === null) {
                  // The week has NOT ELAPSED. Not 0%, not a dash, not a fill:
                  // "we do not know yet" is a different claim to "nobody came back".
                  return (
                    <div key={i} style={{
                      minHeight: 36, borderRadius: 8,
                      border: `1px dashed ${t.line}`, background: 'transparent',
                    }} />
                  );
                }
                return (
                  <div key={i} style={{
                    minHeight: 36, borderRadius: 8, background: cohortFill(v),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: v > 55 ? t.canvas : t.ink,
                    fontSize: 12.5, fontWeight: 700, ...OV_FIG,
                  }}>{v}%</div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </OvPanel>
  );
}

// ─── 2d Last 7 days ───────────────────────────────────────────────────────────

function LastSevenDays({
  metrics, ops, loading,
}: { metrics: MetricsBundle | null; ops: OpsHealth | null; loading: boolean }) {
  const rows = useMemo(() => {
    if (!metrics || !ops) return [];
    return [
      {
        key: 'rounds',
        label: 'Rounds',
        current: ops.activity.rounds_in_window,
        prior: ops.activity.rounds_prev_window,
        note: `by ${fmtInt(ops.activity.rounds_members)} members`,
      },
      { key: 'posts',   label: 'Posts',   current: metrics.posts.current,   prior: metrics.posts.previous },
      { key: 'reviews', label: 'Reviews', current: metrics.reviews.current, prior: metrics.reviews.previous },
      { key: 'signups', label: 'Signups', current: metrics.signups.current, prior: metrics.signups.previous },
    ];
  }, [metrics, ops]);

  return (
    <OvPanel title="Last 7 days" subtitle="Against the 7 days before">
      {loading || rows.length === 0 ? (
        <OvSkeleton height={180} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => (
            <div key={r.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '11px 0',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.hairline}`,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: t.ink, fontSize: 13.5, fontWeight: 600 }}>{r.label}</div>
                {r.note && <div style={{ ...OV_LABEL, ...OV_FIG }}>{r.note}</div>}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ color: t.ink, fontSize: 17, fontWeight: 700, ...OV_FIG }}>{fmtInt(r.current)}</span>
                <DeltaChip delta={pctDelta(r.current, r.prior)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </OvPanel>
  );
}

// ─── 2e Where members go ──────────────────────────────────────────────────────

function WhereMembersGo({ rows, loading }: { rows: ScreenRow[] | null; loading: boolean }) {
  const top = useMemo(() => {
    if (!rows) return [];
    // area === 'Admin' is the manifest's own classification of /admin,
    // /admin/*, /admin-v2/*, /admin-setup and /error-logs.
    return rows
      .filter(r => r.area !== 'Admin' && r.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 7);
  }, [rows]);
  const max = top[0]?.views ?? 0;

  return (
    <OvPanel title="Where members go" subtitle="Top 7 screens by views, last 30 days. The console itself is excluded.">
      {loading || !rows ? (
        <OvSkeleton height={220} />
      ) : top.length === 0 ? (
        <EmptyState title="No screen views recorded" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {top.map(r => (
            <div key={r.route_pattern} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span style={{
                  color: t.ink, fontSize: 13, fontWeight: 600, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{r.label}</span>
                <span style={{ color: t.ink, fontSize: 14, fontWeight: 700, flexShrink: 0, ...OV_FIG }}>
                  {fmtInt(r.views)}
                </span>
              </div>
              <div style={{ height: 8, background: t.canvas, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${max > 0 ? (r.views / max) * 100 : 0}%`, height: '100%',
                  background: brandAlpha(0.55), borderRadius: 999,
                }} />
              </div>
              <div style={{ ...OV_LABEL, ...OV_FIG }}>
                {fmtInt(r.unique_users)} members
                {/* Nullable by design: no dwell samples renders NOTHING, not "0s". */}
                {r.median_dwell_sec !== null && ` · ${Math.round(r.median_dwell_sec)}s median`}
              </div>
            </div>
          ))}
        </div>
      )}
    </OvPanel>
  );
}

// ─── 2f What members did ──────────────────────────────────────────────────────

function WhatMembersDid({ data, loading }: { data: MemberActions | null; loading: boolean }) {
  const actions = (data?.actions ?? []).slice(0, 10);
  return (
    <OvPanel
      title="What members did"
      subtitle="Deliberate actions in the last 7 days. Times and members are separate: one enthusiast is not adoption."
    >
      {loading || !data ? (
        <OvSkeleton height={240} />
      ) : actions.length === 0 ? (
        <div style={{ color: t.inkMuted, fontSize: 13 }}>No actions recorded</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 72px 72px', gap: 8,
            paddingBottom: 8, borderBottom: `1px solid ${t.line}`,
          }}>
            <span style={OV_LABEL}>Action</span>
            <span style={{ ...OV_LABEL, textAlign: 'right' }}>Times</span>
            <span style={{ ...OV_LABEL, textAlign: 'right' }}>Members</span>
          </div>
          {actions.map((a, i) => (
            <div key={a.name} style={{
              display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 72px 72px', gap: 8,
              alignItems: 'center', padding: '10px 0',
              borderBottom: i === actions.length - 1 ? 'none' : `1px solid ${t.hairline}`,
            }}>
              <span style={{
                color: t.ink, fontSize: 13.5, fontWeight: 600, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{humaniseActionName(a.name)}</span>
              <span style={{ color: t.ink, fontSize: 14, fontWeight: 700, textAlign: 'right', ...OV_FIG }}>
                {fmtInt(a.times)}
              </span>
              <span style={{ color: t.inkMuted, fontSize: 14, fontWeight: 700, textAlign: 'right', ...OV_FIG }}>
                {fmtInt(a.members)}
              </span>
            </div>
          ))}
        </div>
      )}
    </OvPanel>
  );
}


// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthTab({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useAuthAnalytics(period);

  const successRate = data?.successRate ?? 0;
  const priorRate = data?.successRatePrior ?? null;
  const delta = (priorRate !== null && data)
    ? Math.round((data.successRate - priorRate) * 10) / 10
    : undefined;

  const failures = data?.totalFailures ?? 0;

  const signupSeries = useMemo(() => {
    if (!data) return [];
    return data.signupSuccessTrend.map((s, i) => ({
      date: s.date,
      success: s.value,
      failure: data.signupFailTrend[i]?.value ?? 0,
    }));
  }, [data]);

  const loginSeries = useMemo(() => {
    if (!data) return [];
    return data.loginSuccessTrend.map((s, i) => ({
      date: s.date,
      success: s.value,
      failure: data.loginFailTrend[i]?.value ?? 0,
    }));
  }, [data]);

  const noSignups = signupSeries.every(d => d.success === 0 && d.failure === 0);
  const noLogins  = loginSeries.every(d => d.success === 0 && d.failure === 0);

  return (
    <>
      <Headline
        eyebrow="Auth success rate"
        value={`${successRate}%`}
        delta={typeof delta === 'number' ? delta : undefined}
        deltaUnit="pt"
        note={`${fmtInt(failures)} failures across signups and logins`}
        loading={isLoading}
      />

      <ChartCard title="Signups" subtitle="Success vs failure" loading={isLoading} isEmpty={!isLoading && noSignups}>
        <AuthStackedBars data={signupSeries} />
      </ChartCard>

      <ChartCard title="Logins" subtitle="Success vs failure" loading={isLoading} isEmpty={!isLoading && noLogins}>
        <AuthStackedBars data={loginSeries} />
      </ChartCard>

      <Card>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Recent auth events</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Latest 20 events in the selected period</div>
        {isLoading ? (
          <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md }} />
        ) : (data?.recentEvents.length ?? 0) === 0 ? (
          <EmptyState title="No auth events yet" subtitle="Events will appear here as members sign up and log in." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data!.recentEvents.map((e, i) => {
              const isLast = i === data!.recentEvents.length - 1;
              const isSignup = e.name === 'signup_success' || e.name === 'signup_failed';
              const label = `${isSignup ? 'Signup' : 'Login'}${e.isFailure ? ' failed' : ''}`;
              const identity = e.userId
                ? (e.displayName || (e.username ? `@${e.username}` : e.userId.slice(0, 8)))
                : (e.email ?? 'Unknown');
              const row = (
                <>
                  <span style={{ display: 'inline-flex', width: 20, justifyContent: 'center' }}>
                    {e.isFailure
                      ? <XCircle size={16} color={t.dangerText} />
                      : <CheckCircle2 size={16} color={t.okText} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.ink, fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                    <div style={{
                      color: t.inkMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{identity}</div>
                  </div>
                  <span style={{
                    color: t.inkFaint, fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', minWidth: 68,
                  }}>{relTime(e.createdAt)}</span>
                </>
              );
              const style: React.CSSProperties = {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', textDecoration: 'none',
                borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
              };
              return e.userId
                ? <Link key={e.id} to={`/admin-v2/users?member=${e.userId}`} style={style}>{row}</Link>
                : <div key={e.id} style={style}>{row}</div>;
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function AuthStackedBars({ data }: { data: { date: string; success: number; failure: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="success" stackId="a" fill={t.ok}     radius={[0, 0, 0, 0]} />
        <Bar dataKey="failure" stackId="a" fill={t.danger} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Keep periodToDays exported symbol used implicitly to avoid TS lint on unused import.
void periodToDays;

// ═══ LIVE TAB (Firebase realtime) ═════════════════════════════════════════════
// - useLiveInApp: shared 5-min distinct-users query (also feeds Dashboard).
// - useLiveWindow30m: 30-min event window that powers the minute chart,
//   the event stream, and the top-screens section (verified `path` prop on
//   page_view via src/hooks/usePageTracking.ts).
// - Both polling queries are visibility-gated in their hook definitions.

function relTimeShort(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function displayNameOf(p?: LiteProfile | null): string {
  if (!p) return 'Member';
  return p.display_name || (p.username ? `@${p.username}` : 'Member');
}

function initialsOf(p?: LiteProfile | null): string {
  const n = p?.display_name || p?.username || '?';
  return (n[0] ?? '?').toUpperCase();
}

function LiveTab() {
  const live = useLiveInApp();
  const window30 = useLiveWindow30m();

  // Collect all user ids we need to name (5-min who-is-here + 30-min stream).
  const idSet = useMemo(() => {
    const s = new Set<string>();
    for (const u of live.data?.users ?? []) s.add(u.user_id);
    for (const e of window30.data ?? []) if (e.user_id) s.add(e.user_id);
    return Array.from(s);
  }, [live.data, window30.data]);
  const profiles = useProfilesByIds(idSet);

  return (
    <>
      <LiveCountCard live={live.data?.count ?? null} loading={live.isLoading} />
      <WhoIsHere
        users={live.data?.users ?? []}
        profilesMap={profiles.data ?? {}}
        loading={live.isLoading}
        isError={live.isError}
        onRetry={() => live.refetch()}
      />
      <LastThirtyMinutesChart
        events={window30.data ?? []}
        loading={window30.isLoading}
        isError={window30.isError}
        onRetry={() => window30.refetch()}
      />
      <TopScreensRightNow
        events={window30.data ?? []}
        loading={window30.isLoading}
      />
    </>
  );
}

function LiveCountCard({ live, loading }: { live: number | null; loading: boolean }) {
  return (
    <Card style={{ borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{
          width: 8, height: 8, borderRadius: 999, background: t.ok,
          animation: 'admin-pulse-dot 1.6s ease-in-out infinite', flexShrink: 0,
        }} />
        <span style={{ color: t.brandText, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Live
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          color: t.ink, fontSize: 42, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {loading || live === null ? '-' : fmtInt(live)}
        </div>
        <div style={{ color: t.inkMuted, fontSize: 14 }}>
          {live === 1 ? 'member' : 'members'} in the app right now
        </div>
      </div>
      <div style={{ color: t.inkFaint, fontSize: 12 }}>
        Distinct members with any event in the last 5 minutes. Refreshes every 15 seconds.
      </div>
    </Card>
  );
}

function WhoIsHere({
  users, profilesMap, loading, isError, onRetry,
}: {
  users: { user_id: string; latestAt: string }[];
  profilesMap: Record<string, LiteProfile>;
  loading: boolean; isError: boolean; onRetry: () => void;
}) {
  return (
    <Card>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Who is here</div>
      <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Members active in the last 5 minutes</div>
      {isError ? (
        <AdminErrorState title="Couldn't load who is here" onRetry={onRetry} />
      ) : loading ? (
        <div style={{ height: 160, background: t.canvas, borderRadius: t.radius.md }} />
      ) : users.length === 0 ? (
        <EmptyState title="Quiet right now" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {users.map((u, i) => {
            const p = profilesMap[u.user_id];
            const name = displayNameOf(p);
            const isLast = i === users.length - 1;
            return (
              <Link
                key={u.user_id}
                to={`/admin-v2/users?member=${u.user_id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', textDecoration: 'none',
                  borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                }}
              >
                <Squircle src={p?.profile_photo_url ?? null} initials={initialsOf(p)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: t.ink, fontSize: 13.5, fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{name}</div>
                  {p?.username && (
                    <div style={{ color: t.inkFaint, fontSize: 11.5 }}>@{p.username}</div>
                  )}
                </div>
                <span style={{
                  color: t.inkMuted, fontSize: 12, fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right', minWidth: 68,
                }}>
                  active {relTimeShort(u.latestAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function LastThirtyMinutesChart({
  events, loading, isError, onRetry,
}: {
  events: LiveEventRow[]; loading: boolean; isError: boolean; onRetry: () => void;
}) {
  const bars = useMemo(() => {
    const now = Date.now();
    const start = now - 30 * 60_000;
    // 30 minute buckets aligned to now.
    const buckets: { minute: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const t0 = now - (i + 1) * 60_000;
      const t1 = now - i * 60_000;
      let value = 0;
      for (const e of events) {
        const ts = new Date(e.created_at).getTime();
        if (ts >= t0 && ts < t1) value += 1;
      }
      buckets.push({
        minute: `${new Date(t1).getHours().toString().padStart(2, '0')}:${new Date(t1).getMinutes().toString().padStart(2, '0')}`,
        value,
      });
      // Only used to sample from unused var to satisfy tsc when start is unused
      void start;
    }
    return buckets;
  }, [events]);

  const empty = !loading && bars.every(b => b.value === 0);

  return (
    <ChartCard title="Last 30 minutes" subtitle="Events per minute" loading={loading} isEmpty={empty}>
      {isError ? (
        <AdminErrorState title="Couldn't load recent events" onRetry={onRetry} />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="minute" tick={{ fontSize: 10, fill: t.inkMuted }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
            <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill={t.brand} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// Verified prop key: page_view events carry `path` in props.
// See src/hooks/usePageTracking.ts line 23:
//   analyticsEvents.track('page_view', { path });
function TopScreensRightNow({ events, loading }: { events: LiveEventRow[]; loading: boolean }) {
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.name !== 'page_view') continue;
      const path = (e.props as any)?.path;
      if (typeof path !== 'string' || !path) continue;
      // The console is not member behaviour. /admin* never counts.
      if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin-v2') || path.startsWith('/admin-setup')) continue;

      counts.set(path, (counts.get(path) ?? 0) + 1);
    }
    return Array.from(counts, ([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  return (
    <Card>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Top screens right now</div>
      <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Most-viewed paths in the last 30 minutes</div>
      {loading ? (
        <div style={{ height: 140, background: t.canvas, borderRadius: t.radius.md }} />
      ) : rows.length === 0 ? (
        <EmptyState title="No page views yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => {
            const isLast = i === rows.length - 1;
            return (
              <div
                key={r.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                }}
              >
                <div style={{
                  flex: 1, minWidth: 0,
                  color: t.ink, fontSize: 13.5, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}>{r.path}</div>
                <span style={{
                  color: t.inkMuted, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                }}>{fmtInt(r.count)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ═══ EVENTS TAB (Firebase events explorer) ════════════════════════════════════

function EventsTab({ period }: { period: AnalyticsPeriod }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EventAggregate | null>(null);
  const { aggregates, data: raw, isLoading, isError, refetch } = useEventAggregates(period);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aggregates;
    return aggregates.filter(a =>
      a.name.toLowerCase().includes(q) || labelForEvent(a.name).toLowerCase().includes(q),
    );
  }, [aggregates, query]);

  const totals = useMemo(() => {
    let count = 0; const users = new Set<string>();
    for (const a of aggregates) count += a.count;
    if (raw) {
      for (const r of raw.rows) if (r.created_at >= raw.cutoffISO && r.user_id) users.add(r.user_id);
    }
    return { count, users: users.size };
  }, [aggregates, raw]);

  return (
    <>
      <Card style={{ borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          color: t.inkFaint, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Events in period</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            color: t.ink, fontSize: 38, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {isLoading ? '-' : fmtInt(totals.count)}
          </div>
          <div style={{ color: t.inkMuted, fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>
            across {fmtInt(aggregates.length)} distinct events, {fmtInt(totals.users)} members
          </div>
        </div>
      </Card>

      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: `1px solid ${t.line}`, borderRadius: 999, background: t.canvas,
          padding: '8px 12px', marginBottom: 12,
        }}>
          <Search size={14} color={t.inkMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event name or label"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none',
              background: 'transparent', color: t.ink, fontSize: 13,
            }}
          />
        </div>

        {isError ? (
          <AdminErrorState title="Couldn't load events" onRetry={() => refetch()} />
        ) : isLoading ? (
          <div style={{ height: 260, background: t.canvas, borderRadius: t.radius.md }} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No events match" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((a, i) => {
              const isLast = i === filtered.length - 1;
              return (
                <button
                  key={a.name}
                  onClick={() => setSelected(a)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', width: '100%',
                    background: 'transparent', border: 'none', textAlign: 'left',
                    borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: t.ink, fontSize: 13.5, fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{labelForEvent(a.name)}</div>
                    <div style={{
                      color: t.inkFaint, fontSize: 10.5,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{a.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        color: t.ink, fontSize: 13.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      }}>{fmtInt(a.count)}</div>
                      <div style={{
                        color: t.inkFaint, fontSize: 11, fontVariantNumeric: 'tabular-nums',
                      }}>{fmtInt(a.users)} users</div>
                    </div>
                    <DeltaChip delta={a.deltaPct} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <EventDetailSheet
        aggregate={selected}
        period={period}
        rows={raw?.rows ?? []}
        cutoffISO={raw?.cutoffISO ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function EventDetailSheet({
  aggregate, period, rows, cutoffISO, onClose,
}: {
  aggregate: EventAggregate | null;
  period: AnalyticsPeriod;
  rows: { name: string; user_id: string | null; created_at: string }[];
  cutoffISO: string | null;
  onClose: () => void;
}) {
  const days = periodToDays(period);
  const daily = useMemo(() => {
    if (!aggregate || !cutoffISO) return [];
    return dailyForEvent(rows, cutoffISO, aggregate.name, days);
  }, [aggregate, cutoffISO, rows, days]);

  const occurrences = useRecentOccurrences(aggregate?.name ?? null, cutoffISO);
  const ids = useMemo(() => {
    const s = new Set<string>();
    for (const o of occurrences.data ?? []) if (o.user_id) s.add(o.user_id);
    return Array.from(s);
  }, [occurrences.data]);
  const profiles = useProfilesByIds(ids);

  const total = aggregate?.count ?? 0;
  const users = aggregate?.users ?? 0;
  const perUser = users > 0 ? Math.round((total / users) * 10) / 10 : 0;

  return (
    <AdminSheet
      open={!!aggregate}
      onClose={onClose}
      title={aggregate ? labelForEvent(aggregate.name) : ''}
      subtitle={aggregate?.name}
      maxWidth={560}
    >
      {aggregate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8,
          }}>
            <StatBox label="Total" value={fmtInt(total)} />
            <StatBox label="Unique users" value={fmtInt(users)} />
            <StatBox label="Per user" value={perUser.toFixed(1)} />
          </div>

          <ChartCard title="Daily count" subtitle={`Occurrences per day, last ${period}`} loading={false}
            isEmpty={daily.every(d => d.value === 0)}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
                <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill={t.brand} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div>
            <div style={{ color: t.ink, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Recent occurrences</div>
            <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 10 }}>Latest 15 in the selected period</div>
            {occurrences.isError ? (
              <AdminErrorState title="Couldn't load occurrences" onRetry={() => occurrences.refetch()} />
            ) : occurrences.isLoading ? (
              <div style={{ height: 180, background: t.canvas, borderRadius: t.radius.md }} />
            ) : (occurrences.data ?? []).length === 0 ? (
              <EmptyState title="No recent occurrences" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {occurrences.data!.map((o, i) => {
                  const isLast = i === occurrences.data!.length - 1;
                  const p = o.user_id ? (profiles.data ?? {})[o.user_id] : null;
                  const name = o.user_id ? displayNameOf(p) : 'System';
                  const propsLine = o.props && Object.keys(o.props).length > 0
                    ? (() => {
                      const s = JSON.stringify(o.props);
                      return s.length > 60 ? `${s.slice(0, 60)}…` : s;
                    })()
                    : null;
                  const row = (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: t.ink, fontSize: 13, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{name}</div>
                        {propsLine && (
                          <div style={{
                            color: t.inkFaint, fontSize: 11,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{propsLine}</div>
                        )}
                      </div>
                      <span style={{
                        color: t.inkFaint, fontSize: 12, fontVariantNumeric: 'tabular-nums',
                        textAlign: 'right', minWidth: 68,
                      }}>{relTimeShort(o.created_at)}</span>
                    </>
                  );
                  const style: React.CSSProperties = {
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', textDecoration: 'none',
                    borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                  };
                  return o.user_id
                    ? <Link key={o.id} to={`/admin-v2/users?member=${o.user_id}`} style={style} onClick={onClose}>{row}</Link>
                    : <div key={o.id} style={style}>{row}</div>;
                })}
              </div>
            )}
          </div>

          <div style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          }} />
        </div>
      )}
    </AdminSheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: t.canvas, border: `1px solid ${t.line}`, borderRadius: 14,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        color: t.inkFaint, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        color: t.ink, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

// ─── Funnels ──────────────────────────────────────────────────────────────────

function FunnelsTab({ period }: { period: AnalyticsPeriod }) {
  const { signup, rating, auth } = useFunnels(period);

  const anyError = signup.isError || rating.isError || auth.isError;
  const refetchAll = () => { signup.refetch(); rating.refetch(); auth.refetch(); };

  return (
    <>
      {anyError && (
        <AdminErrorState title="Couldn't load funnels" onRetry={refetchAll} />
      )}
      {signup.data
        ? <FunnelCard view={signup.data} loading={signup.isLoading} />
        : <FunnelCard view={{ id: 'signup', title: 'Sign-up', subtitle: '', steps: [], isEmpty: true }} loading />}
      {rating.data
        ? <FunnelCard view={rating.data} loading={rating.isLoading} />
        : <FunnelCard view={{ id: 'rating', title: 'Course rating', subtitle: '', steps: [], isEmpty: true }} loading />}
      {auth.data
        ? <FunnelCard view={auth.data} loading={auth.isLoading} />
        : <FunnelCard view={{ id: 'auth', title: 'Auth flow', subtitle: '', steps: [], isEmpty: true }} loading />}

      <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }} />
    </>
  );
}
