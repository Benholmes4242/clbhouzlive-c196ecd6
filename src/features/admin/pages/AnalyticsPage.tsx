import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, RefreshCcw, Search, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { adminTheme as t } from '../theme';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import AdminErrorState from '../components/AdminErrorState';
import AdminSheet from '../components/AdminSheet';
import { labelForEvent } from '../lib/eventLabels';
import { useLiveInApp } from '../hooks/useOverviewMetrics';
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
  useRetentionAnalytics,
  useGrowthAnalytics,
  useContentAnalytics,
  useAuthAnalytics,
} from '../hooks/useAnalytics';

type TabId = 'live' | 'growth' | 'engagement' | 'retention' | 'events' | 'auth';

const TABS: { id: TabId; label: string }[] = [
  { id: 'live',       label: 'Live' },
  { id: 'growth',     label: 'Growth' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'retention',  label: 'Retention' },
  { id: 'events',     label: 'Events' },
  { id: 'auth',       label: 'Auth' },
];

const PERIODS: AnalyticsPeriod[] = ['7d', '30d', '90d'];
const ALL_PERIODS: AnalyticsPeriod[] = ['7d', '14d', '30d', '90d'];

const isTab = (v: string | null): v is TabId =>
  !!v && TABS.some(x => x.id === v);
const isPeriod = (p: string | null): p is AnalyticsPeriod =>
  !!p && (ALL_PERIODS as string[]).includes(p);

// Legacy ?view= mapping (D5 rename) so old links keep working.
function legacyViewToTab(v: string | null): TabId | null {
  if (!v) return null;
  if (v === 'growth' || v === 'engagement' || v === 'retention' || v === 'auth') return v;
  if (v === 'platform' || v === 'content') return 'engagement';
  return null;
}

export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();

  const tabParam = params.get('tab');
  const viewParam = params.get('view');
  const tab: TabId = isTab(tabParam)
    ? tabParam
    : legacyViewToTab(viewParam) ?? 'live';
  const period: AnalyticsPeriod = isPeriod(params.get('period')) ? (params.get('period') as AnalyticsPeriod) : '30d';
  const showPeriodSelector = tab !== 'live';

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

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-v2', 'analytics'] });
  };

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          color: t.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
        }}>ADMIN</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ color: t.ink, fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.2 }}>Analytics</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showPeriodSelector && (
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
                        color: active ? t.surface : t.inkMuted,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >{p}</button>
                  );
                })}
              </div>
            )}
            <button
              onClick={refresh}
              aria-label="Refresh"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 999,
                border: `1px solid ${t.line}`, background: t.surface, color: t.inkMuted, cursor: 'pointer',
              }}
            >
              <RefreshCcw size={15} />
            </button>
          </div>
        </div>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
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
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: 999,
                border: `1px solid ${active ? 'transparent' : t.line}`,
                background: active ? t.brandSoft : t.surface,
                color: active ? t.brandText : t.inkMuted,
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

      {tab === 'growth'     && <GrowthTab     period={period} />}
      {tab === 'engagement' && <EngagementTab period={period} />}
      {tab === 'retention'  && <RetentionTab />}
      {tab === 'auth'       && <AuthTab       period={period} />}
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function fmtTick(v: number) { return v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`; }
function fmtInt(n: number) { return n.toLocaleString(); }
function pctDelta(current: number, prior: number): number {
  if (prior === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 100 * 10) / 10;
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

function DeltaChip({ delta, unit = '%' }: { delta: number; unit?: string }) {
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
          color: t.ink, fontSize: 38, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {loading ? '-' : value}
        </div>
        {!loading && typeof delta === 'number' && (
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
        delta={typeof delta === 'number' ? delta : undefined}
        note={`vs ${fmtInt(prior)} in the prior period`}
        loading={isLoading}
      />

      <ChartCard title="Daily signups" subtitle={`Signups per day, last ${period}`} loading={isLoading} isEmpty={trendEmpty}>
        <BarTrend data={platform.data?.signupTrend ?? []} />
      </ChartCard>

      <ChartCard title="Members over time" subtitle={`Cumulative member count across the period`} loading={isLoading} isEmpty={cumulative.length === 0}>
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
        isEmpty={!isLoading && !platform.data?.dau?.some(d => d.value > 0)}>
        <AreaTrend data={platform.data?.dau ?? []} />
      </ChartCard>

      <ChartCard title="Daily event volume" loading={isLoading}
        isEmpty={!isLoading && (!eng.data || eng.data.totalEvents === 0)}>
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
        isEmpty={!isLoading && (!eng.data || eng.data.totalEvents === 0)}>
        <BarTrend data={(eng.data?.hourlyBreakdown ?? []).map(h => ({ date: `${h.hour}`, value: h.count }))} />
      </ChartCard>

      <ChartCard title="Posts and reviews" subtitle="Posts (brand) and reviews (ink)" loading={content.isLoading}
        isEmpty={!content.isLoading && combined.every(d => d.posts === 0 && d.reviews === 0)}>
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

// ─── Retention ────────────────────────────────────────────────────────────────

function heatBg(value: number | null): string {
  if (value === null || value === 0) return t.canvas;
  // 0.08 base + value-proportional up to ~0.6
  const alpha = 0.08 + Math.min(0.52, (value / 100) * 0.52);
  // adminTheme.brand is a hex, convert to rgba
  const hex = t.brand.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function RetentionTab() {
  const { data, isLoading } = useRetentionAnalytics();
  const cohorts = data?.cohorts ?? [];
  const empty = !isLoading && cohorts.length === 0;

  // Headline: most recent cohort where retention[1] (W1) is not null.
  const w1Cohort = cohorts.find(c => c.retention[1] !== null);
  const w1Prior = w1Cohort
    ? cohorts.slice(cohorts.indexOf(w1Cohort) + 1).find(c => c.retention[1] !== null)
    : undefined;
  const w1Value = w1Cohort?.retention[1] ?? null;
  const w1DeltaPts = (w1Value !== null && w1Prior?.retention[1] !== undefined && w1Prior.retention[1] !== null)
    ? Math.round((w1Value - w1Prior.retention[1]!) * 10) / 10
    : null;

  const maxOffsets = cohorts.reduce((m, c) => Math.max(m, c.retention.length), 0);
  const offsetCount = Math.max(4, Math.min(maxOffsets, 9));

  return (
    <>
      <Headline
        eyebrow="Week 1 retention"
        value={w1Value !== null ? `${w1Value}%` : '-'}
        delta={w1DeltaPts !== null ? w1DeltaPts : undefined}
        deltaUnit="pt"
        note={w1Cohort ? `${w1Cohort.cohortLabel} cohort, ${fmtInt(w1Cohort.cohortSize)} members` : 'No qualifying cohort yet'}
        loading={isLoading}
      />

      <Card>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Cohort retention</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Share of each cohort active in the weeks after joining.</div>
        {isLoading ? (
          <div style={{ height: 220, background: t.canvas, borderRadius: t.radius.md }} />
        ) : empty ? (
          <EmptyState title="Not enough data yet" subtitle="Cohort retention will populate as members accumulate." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: t.inkMuted, fontWeight: 600, minWidth: 120, maxWidth: 180 }}>Cohort</th>
                  {Array.from({ length: offsetCount }, (_, i) => (
                    <th key={i} style={{ textAlign: 'center', padding: '6px 4px', color: t.inkMuted, fontWeight: 600, minWidth: 36 }}>W{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((r, ri) => (
                  <tr key={ri}>
                    <td style={{ padding: '6px 8px', color: t.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.cohortLabel}</div>
                      <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(r.cohortSize)} members</div>
                    </td>
                    {Array.from({ length: offsetCount }, (_, ci) => {
                      const v = ci < r.retention.length ? r.retention[ci] : null;
                      const bg = heatBg(v);
                      return (
                        <td key={ci} style={{ padding: 0, minWidth: 36 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: bg, borderRadius: 6, minHeight: 34,
                            color: v === null ? t.inkFaint : t.ink,
                            fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums',
                          }}>
                            {v === null ? '-' : `${v}%`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
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
