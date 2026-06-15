import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { adminTheme as t } from '../theme';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import StatTile from '../components/StatTile';
import EmptyState from '../components/EmptyState';
import {
  AnalyticsPeriod,
  usePlatformAnalytics,
  useEngagementAnalytics,
  useRetentionAnalytics,
  useGrowthAnalytics,
  useContentAnalytics,
  useAuthAnalytics,
} from '../hooks/useAnalytics';

type ViewId = 'platform' | 'engagement' | 'retention' | 'growth' | 'content' | 'auth';

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'platform',   label: 'Platform' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'retention',  label: 'Retention' },
  { id: 'growth',     label: 'Growth' },
  { id: 'content',    label: 'Content' },
  { id: 'auth',       label: 'Auth & Security' },
];

const PERIODS: AnalyticsPeriod[] = ['7d', '14d', '30d', '90d'];

const isView = (v: string | null): v is ViewId =>
  !!v && VIEWS.some(x => x.id === v);
const isPeriod = (p: string | null): p is AnalyticsPeriod =>
  !!p && (PERIODS as string[]).includes(p);

export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const view: ViewId = isView(params.get('view')) ? (params.get('view') as ViewId) : 'platform';
  const period: AnalyticsPeriod = isPeriod(params.get('period')) ? (params.get('period') as AnalyticsPeriod) : '30d';

  const setView = (v: ViewId) => {
    const next = new URLSearchParams(params);
    next.set('view', v);
    if (!next.get('period')) next.set('period', period);
    setParams(next, { replace: true });
  };
  const setPeriod = (p: AnalyticsPeriod) => {
    const next = new URLSearchParams(params);
    next.set('period', p);
    if (!next.get('view')) next.set('view', view);
    setParams(next, { replace: true });
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280, margin: '0 auto' }}>
      {/* View switcher + period picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '2px 0',
          }}
        >
          {VIEWS.map(v => {
            const active = v.id === view;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1px solid ${active ? 'transparent' : t.line}`,
                  background: active ? t.brandSoft : t.surface,
                  color: active ? t.brandText : t.inkMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: t.inkFaint, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginRight: 4 }}>
            Period
          </span>
          {PERIODS.map(p => {
            const active = p === period;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: `1px solid ${active ? t.brand : t.line}`,
                  background: active ? t.brandSoft : t.surface,
                  color: active ? t.brandText : t.inkMuted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {view === 'platform'   && <PlatformView   period={period} />}
      {view === 'engagement' && <EngagementView period={period} />}
      {view === 'retention'  && <RetentionView />}
      {view === 'growth'     && <GrowthView     period={period} />}
      {view === 'content'    && <ContentView    period={period} />}
      {view === 'auth'       && <AuthView       period={period} />}
    </div>
  );
}

// ─── Shared chart primitives ──────────────────────────────────────────────────

function fmtTick(v: number) { return v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`; }

function AreaTrend({ data, height = 220 }: { data: { date: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="aa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
            <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="value" stroke={t.brand} strokeWidth={1.8} fill="url(#aa)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BarTrend({ data, xKey = 'date', height = 220 }: { data: any[]; xKey?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="value" fill={t.brand} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
      }}
      className="admin-v3-kpi-grid"
    >
      {children}
      <style>{`
        @media (min-width: 720px) {
          .admin-v3-kpi-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Platform view ────────────────────────────────────────────────────────────

function PlatformView({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = usePlatformAnalytics(period);
  const empty = !isLoading && (!data?.signupTrend?.some(d => d.value > 0));

  return (
    <>
      <KpiGrid>
        <KpiCard label="Total Users"     value={data?.totalUsers ?? 0}     loading={isLoading} />
        <KpiCard label="New This Period" value={data?.newThisPeriod ?? 0} loading={isLoading} />
        <KpiCard label="Avg DAU"         value={data?.avgDau ?? 0}        loading={isLoading} />
        <KpiCard label="Peak DAU"        value={data?.peakDau ?? 0}       loading={isLoading} />
        <KpiCard label="WAU"             value={data?.wau ?? 0}           loading={isLoading} />
        <KpiCard label="MAU"             value={data?.mau ?? 0}           loading={isLoading} />
        <KpiCard label="Stickiness"      value={`${data?.dauMauRatio ?? 0}%`} loading={isLoading} />
        <KpiCard label="Echo Queries"    value={data?.echoTotal ?? 0}     loading={isLoading} />
      </KpiGrid>

      {data && (data.echoTotal > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <StatTile label="Echo unique users" value={data.echoUniqueUsers} />
        </div>
      )}

      <ChartCard title="Signups" subtitle={`Daily signups · last ${period}`} loading={isLoading} isEmpty={empty}>
        <AreaTrend data={data?.signupTrend ?? []} />
      </ChartCard>
      <ChartCard title="Daily Active Users" subtitle={`Unique active users · last ${period}`} loading={isLoading} isEmpty={!isLoading && !data?.dau?.some(d => d.value > 0)}>
        <AreaTrend data={data?.dau ?? []} />
      </ChartCard>
    </>
  );
}

// ─── Engagement view ──────────────────────────────────────────────────────────

function EngagementView({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useEngagementAnalytics(period);
  const empty = !isLoading && (!data || data.totalEvents === 0);

  return (
    <>
      <KpiGrid>
        <KpiCard label="Total Events"   value={data?.totalEvents ?? 0}    loading={isLoading} />
        <KpiCard label="Avg / User / Day" value={data?.avgEventsPerUserPerDay ?? 0} loading={isLoading} />
        <KpiCard label="Unique Users"   value={data?.uniqueUsers ?? 0}   loading={isLoading} />
        <KpiCard label="Busiest Hour"   value={data ? `${data.busiestHour}:00` : '—'} loading={isLoading} />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatTile label="Messages Sent"    value={data?.social.messagesSent ?? 0} />
        <StatTile label="Follow Actions"   value={data?.social.followActions ?? 0} />
        <StatTile label="Friend Requests"  value={data?.social.friendRequests ?? 0} />
      </div>

      <ChartCard title="Daily Event Volume" loading={isLoading} isEmpty={empty}>
        <AreaTrend data={data?.dailyTrend ?? []} />
      </ChartCard>
      <ChartCard title="Hourly Breakdown" subtitle="Events by hour of day" loading={isLoading} isEmpty={empty}>
        <BarTrend data={(data?.hourlyBreakdown ?? []).map(h => ({ date: `${h.hour}`, value: h.count }))} />
      </ChartCard>

      <div
        style={{
          background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg,
          boxShadow: t.shadowCard, padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Top Events</div>
        {isLoading ? (
          <div style={{ color: t.inkMuted, fontSize: 13 }}>Loading…</div>
        ) : (data?.topEvents?.length ?? 0) === 0 ? (
          <EmptyState title="No events yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data!.topEvents.slice(0, 10).map((e, i) => (
              <div key={e.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i === Math.min(9, data!.topEvents.length - 1) ? 'none' : `1px solid ${t.line}`,
              }}>
                <span style={{ color: t.ink, fontSize: 13, fontWeight: 500 }}>{e.name}</span>
                <span style={{ color: t.inkMuted, fontSize: 12 }}>
                  {e.count.toLocaleString()} · {e.uniqueUsers} users
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Retention view ───────────────────────────────────────────────────────────

function getCellColor(value: number | null): { bg: string; text: string } {
  if (value === null) return { bg: t.canvas, text: t.inkFaint };
  if (value === 0)    return { bg: t.surface, text: t.inkFaint };
  if (value <= 25)    return { bg: t.warnSoft, text: t.warnText };
  if (value <= 50)    return { bg: t.warnSoft, text: t.warnText };
  if (value <= 75)    return { bg: t.brandSoft, text: t.brandText };
  return { bg: t.brand, text: t.surface };
}

function RetentionView() {
  const { data, isLoading } = useRetentionAnalytics();
  const empty = !isLoading && (!data || data.cohorts.length === 0);

  return (
    <>
      <KpiGrid>
        <KpiCard label="D7 Retention"  value={`${data?.d7Retention ?? 0}%`} loading={isLoading} />
        <KpiCard label="D30 Retention" value={`${data?.d30Retention ?? 0}%`} loading={isLoading} />
        <KpiCard label="Avg Session"   value={data ? `${data.avgSessionLength}s` : '—'} loading={isLoading} />
        <KpiCard label="Churn Risk"    value={data?.churnRisk ?? 0} loading={isLoading} />
      </KpiGrid>

      <div
        style={{
          background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg,
          boxShadow: t.shadowCard, padding: 16,
        }}
      >
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Weekly Cohort Retention</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>
          % of users active each week after signup
        </div>
        {isLoading ? (
          <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md }} />
        ) : empty ? (
          <EmptyState title="Not enough data yet" subtitle="Cohort retention will populate as users accumulate." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.line}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 8px', color: t.inkMuted, minWidth: 140 }}>Cohort</th>
                  <th style={{ textAlign: 'center', padding: '8px 8px', color: t.inkMuted }}>Size</th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i} style={{ textAlign: 'center', padding: '8px 4px', color: t.inkMuted, minWidth: 48 }}>Wk {i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data!.cohorts.map((r, ri) => (
                  <tr key={ri} style={{ borderBottom: `1px solid ${t.line}` }}>
                    <td style={{ padding: '6px 8px', color: t.ink, fontWeight: 500 }}>{r.cohortLabel}</td>
                    <td style={{ padding: '6px 8px', color: t.inkMuted, textAlign: 'center' }}>{r.cohortSize}</td>
                    {r.retention.map((v, ci) => {
                      const { bg, text } = getCellColor(v);
                      return (
                        <td key={ci} style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: bg, color: text, borderRadius: 6, width: 40, height: 24,
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {v !== null ? `${v}%` : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Growth view ──────────────────────────────────────────────────────────────

function GrowthView({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useGrowthAnalytics(period);
  const funnel = data?.funnel ?? [];
  const geo = data?.geo ?? [];

  return (
    <>
      <div
        style={{
          background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg,
          boxShadow: t.shadowCard, padding: 16,
        }}
      >
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Signup Funnel</div>
        {isLoading ? (
          <div style={{ height: 160, background: t.canvas, borderRadius: t.radius.md }} />
        ) : funnel.every(s => s.count === 0) ? (
          <EmptyState title="No signups in this period" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {funnel.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: t.ink, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ color: t.inkMuted }}>
                    {s.count.toLocaleString()} {i > 0 && s.dropPct > 0 ? `· -${s.dropPct}%` : ''}
                  </span>
                </div>
                <div style={{ height: 8, background: t.canvas, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: t.brand }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg,
          boxShadow: t.shadowCard, padding: 16,
        }}
      >
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Users by Country</div>
        {isLoading ? (
          <div style={{ height: 160, background: t.canvas, borderRadius: t.radius.md }} />
        ) : geo.length === 0 ? (
          <EmptyState title="No geo data yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {geo.slice(0, 15).map((g, i) => (
              <div key={g.country} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i === Math.min(14, geo.length - 1) ? 'none' : `1px solid ${t.line}`,
              }}>
                <span style={{ color: t.ink, fontSize: 13, fontWeight: 500 }}>{g.country}</span>
                <span style={{ color: t.inkMuted, fontSize: 12 }}>
                  {g.userCount.toLocaleString()} · {g.pctOfTotal}%
                  {g.newThisPeriod > 0 && (
                    <span style={{ color: t.okText, marginLeft: 6 }}>+{g.newThisPeriod}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Content view ─────────────────────────────────────────────────────────────

function ContentView({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useContentAnalytics(period);
  const empty = !isLoading && (!data?.postsTrend?.some(d => d.value > 0));

  return (
    <>
      <KpiGrid>
        <KpiCard label="Total Posts"     value={data?.totalPosts ?? 0}        loading={isLoading} />
        <KpiCard label="Posts (period)"  value={data?.postsThisPeriod ?? 0}  loading={isLoading} />
        <KpiCard label="Total Reviews"   value={data?.totalReviews ?? 0}     loading={isLoading} />
        <KpiCard label="Reviews (period)" value={data?.reviewsThisPeriod ?? 0} loading={isLoading} />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatTile label="Video Posts (period)" value={data?.videoPostsThisPeriod ?? 0} />
      </div>

      <ChartCard title="Daily Posts" loading={isLoading} isEmpty={empty}>
        <AreaTrend data={data?.postsTrend ?? []} />
      </ChartCard>

      <div
        style={{
          background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg,
          boxShadow: t.shadowCard, padding: 16,
        }}
      >
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Top Reviewed Courses</div>
        {isLoading ? (
          <div style={{ height: 160, background: t.canvas, borderRadius: t.radius.md }} />
        ) : (data?.topReviewedCourses?.length ?? 0) === 0 ? (
          <EmptyState title="No reviews yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data!.topReviewedCourses.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i === data!.topReviewedCourses.length - 1 ? 'none' : `1px solid ${t.line}`,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: t.ink, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: t.inkFaint, fontSize: 11 }}>{c.country}</span>
                </div>
                <span style={{ color: t.inkMuted, fontSize: 12 }}>
                  {c.count} · ★ {c.avgRating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Auth view ────────────────────────────────────────────────────────────────

function AuthView({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useAuthAnalytics(period);
  const noEvents =
    !isLoading && data &&
    data.totalSignups === 0 && data.totalLogins === 0;

  const onboardingPct = data && data.onboardingTotal > 0
    ? Math.round((data.onboardingComplete / data.onboardingTotal) * 100)
    : 0;

  return (
    <>
      <KpiGrid>
        <KpiCard label="Signups"        value={data?.totalSignups ?? 0}  loading={isLoading} />
        <KpiCard label="Signup Fail %"  value={`${data?.signupFailRate ?? 0}%`} loading={isLoading} />
        <KpiCard label="Logins"         value={data?.totalLogins ?? 0}   loading={isLoading} />
        <KpiCard label="Login Fail %"   value={`${data?.loginFailRate ?? 0}%`} loading={isLoading} />
        <KpiCard label="Onboarding Complete" value={`${onboardingPct}%`}  loading={isLoading} />
      </KpiGrid>

      {noEvents ? (
        <div
          style={{
            background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg,
            boxShadow: t.shadowCard, padding: 16,
          }}
        >
          <EmptyState
            title="No auth events yet"
            subtitle="Collecting data since tracking fix — events will appear as users sign up and log in."
          />
        </div>
      ) : (
        <>
          <ChartCard title="Signups" subtitle="Success vs. failure" loading={isLoading}
            isEmpty={!isLoading && !data?.signupSuccessTrend.some(d => d.value > 0) && !data?.signupFailTrend.some(d => d.value > 0)}
          >
            <AreaTrend data={data?.signupSuccessTrend ?? []} />
          </ChartCard>
          <ChartCard title="Logins" subtitle="Success vs. failure" loading={isLoading}
            isEmpty={!isLoading && !data?.loginSuccessTrend.some(d => d.value > 0) && !data?.loginFailTrend.some(d => d.value > 0)}
          >
            <AreaTrend data={data?.loginSuccessTrend ?? []} />
          </ChartCard>
        </>
      )}
    </>
  );
}
