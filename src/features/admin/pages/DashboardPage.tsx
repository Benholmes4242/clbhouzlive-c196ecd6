import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis, BarChart, Bar,
} from 'recharts';
import {
  CheckCircle2, ChevronRight, Activity, ShieldCheck, Mail, Clock,
  AlertCircle,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { panelCan } from '@/lib/panelCan';
import { usePanelRole } from '@/hooks/usePanelRole';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import DataList from '../components/DataList';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';
import StatusPill from '../components/StatusPill';

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

export default function DashboardPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const { kpis, queue, trend, audit, glance, egSyncHealth, refetchAll } = useDashboard();

  // Header refresh hook-in
  useEffect(() => {
    const handler = () => refetchAll();
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [refetchAll]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280, margin: '0 auto' }}>
      {/* KPIs */}
      <section className="admin-v2-kpis">
        <KpiCard
          label="Total Users"
          value={kpis.data?.totalUsers.value ?? 0}
          delta={kpis.data?.totalUsers.delta}
          trend={kpis.data?.totalUsers.trend}
          loading={kpis.isLoading}
        />
        <KpiCard
          label="New Today"
          value={kpis.data?.newUsersToday.value ?? 0}
          delta={kpis.data?.newUsersToday.delta}
          loading={kpis.isLoading}
        />
        <KpiCard
          label="Active 24h"
          value={kpis.data?.activeUsers24h.value ?? 0}
          delta={kpis.data?.activeUsers24h.delta}
          loading={kpis.isLoading}
        />
        <KpiCard
          label="Posts Today"
          value={kpis.data?.postsToday.value ?? 0}
          delta={kpis.data?.postsToday.delta}
          loading={kpis.isLoading}
        />
      </section>

      {/* Action Queue */}
      <ActionQueueCard queue={queue.data} loading={queue.isLoading} />

      {/* Activity Trend */}
      <ChartCard
        title="Activity (14 days)"
        subtitle="Users, posts, reviews per day"
        loading={trend.isLoading}
        isEmpty={!trend.isLoading && (!trend.data || trend.data.every(d => !d.users && !d.posts && !d.reviews))}
        emptyTitle="No activity yet"
        emptySubtitle="Data will appear as users sign up and post."
        height={240}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="g-users" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
                <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.line} vertical={false} />
            <XAxis dataKey="date" stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              contentStyle={{
                background: t.surface, border: `1px solid ${t.line}`,
                borderRadius: 8, fontSize: 12, boxShadow: t.shadowPop,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="users"   stroke={t.brand} strokeWidth={2} fill="url(#g-users)" />
            <Area type="monotone" dataKey="posts"   stroke="#0EA5E9" strokeWidth={2} fill="transparent" />
            <Area type="monotone" dataKey="reviews" stroke="#16A34A" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* EG Sync Health */}
      <EgSyncCard data={egSyncHealth.data} loading={egSyncHealth.isLoading} isError={egSyncHealth.isError} />

      {/* Today at a glance */}
      <section className="admin-v2-twocol">
        <ChartCard
          title="Posts by hour (today)"
          loading={glance.isLoading}
          isEmpty={!glance.isLoading && (!glance.data?.postsByHour || glance.data.postsByHour.every(b => b.count === 0))}
          emptyTitle="No posts yet today"
          height={180}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={glance.data?.postsByHour ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={t.line} vertical={false} />
              <XAxis dataKey="hour" stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={t.brand} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card title="Top 3 active users">
          {glance.isLoading ? (
            <div style={{ height: 120, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ) : (glance.data?.topActiveUsers.length ?? 0) === 0 ? (
            <EmptyState title="No activity yet today" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {glance.data!.topActiveUsers.map((u, i) => (
                <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 22, textAlign: 'center', color: t.inkFaint,
                      fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {i + 1}
                  </div>
                  <SquircleAvatar src={u.avatarUrl ?? undefined} alt={u.displayName} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.ink, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.displayName}
                    </div>
                    <div style={{ color: t.inkMuted, fontSize: 12 }}>
                      {u.eventCount} events
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Recent Admin Activity (full only) */}
      {can.manageAdmins && (
        <Card title="Recent admin activity">
          <DataList
            loading={audit.isLoading}
            rows={audit.data ?? []}
            rowKey={(r) => r.id}
            columns={[
              { key: 'action', header: 'Action', render: (r) => <span style={{ fontWeight: 600 }}>{r.action}</span> },
              { key: 'target', header: 'Target', render: (r) => r.targetEmail ?? '—' },
              { key: 'when',   header: 'When',   align: 'right', render: (r) => <span style={{ color: t.inkMuted }}>{relTime(r.createdAt)}</span> },
            ]}
            renderCard={(r) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: t.ink, fontSize: 14 }}>{r.action}</span>
                  <span style={{ color: t.inkMuted, fontSize: 12 }}>{relTime(r.createdAt)}</span>
                </div>
                <span style={{ color: t.inkMuted, fontSize: 12 }}>{r.targetEmail ?? '—'}</span>
              </div>
            )}
            emptyTitle="No admin activity yet"
          />
        </Card>
      )}

      <style>{`
        .admin-v2-kpis { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .admin-v2-twocol { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) {
          .admin-v2-kpis { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .admin-v2-kpis { grid-template-columns: repeat(4, 1fr); }
          .admin-v2-twocol { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared Card ──────────────────────────────────────────────────────────────

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Action queue ─────────────────────────────────────────────────────────────

function ActionQueueCard({ queue, loading }: { queue?: { pendingVerifications: number; pendingInvites: number; expiringAccess: number; pendingCourseClaims: number }; loading: boolean }) {
  const items = [
    { label: 'Pending Verifications', count: queue?.pendingVerifications ?? 0, to: '/admin-v2/users?tab=verifications', Icon: ShieldCheck },
    { label: 'Pending Course Claims', count: queue?.pendingCourseClaims ?? 0, to: '/admin-v2/users?tab=verifications&entity=course_claim', Icon: ShieldCheck },
    { label: 'Pending Invites',       count: queue?.pendingInvites ?? 0,       to: '/admin-v2/users?tab=invites',       Icon: Mail },
    { label: 'Expiring Access',       count: queue?.expiringAccess ?? 0,       to: '/admin-v2/users?tab=team',          Icon: Clock },
  ];
  const visible = items.filter(i => i.count > 0);
  const allClear = !loading && visible.length === 0;

  return (
    <Card title="Action queue">
      {loading ? (
        <div style={{ height: 110, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : allClear ? (
        <EmptyState
          icon={<CheckCircle2 size={32} color={t.ok} />}
          title="All clear"
          subtitle="No pending actions need your attention right now."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visible.map((it, idx) => (
            <Link
              key={it.label}
              to={it.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 4px',
                borderTop: idx === 0 ? 'none' : `1px solid ${t.line}`,
                textDecoration: 'none',
                color: t.ink,
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: t.radius.md,
                  background: t.brandSoft, color: t.brandText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <it.Icon size={18} />
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{it.label}</div>
              <span
                style={{
                  background: t.ink, color: t.surface,
                  fontSize: 12, fontWeight: 700,
                  borderRadius: 999, padding: '2px 10px', minWidth: 28, textAlign: 'center',
                }}
              >
                {it.count}
              </span>
              <ChevronRight size={16} color={t.inkFaint} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── EG sync health ───────────────────────────────────────────────────────────

function EgSyncCard({ data, loading, isError }: { data: any; loading: boolean; isError: boolean }) {
  const statusToneMap: Record<string, { tone: any; label: string }> = {
    green: { tone: 'ok',      label: 'Healthy' },
    amber: { tone: 'warn',    label: 'Degraded' },
    red:   { tone: 'danger',  label: 'Failing' },
    idle:  { tone: 'neutral', label: 'Idle' },
  };
  const status = data?.status ?? 'idle';
  const tone = statusToneMap[status] ?? statusToneMap.idle;
  const cronHours = data?.cron_hours_ago;

  return (
    <Card
      title="EG sync health"
      action={
        !loading && !isError ? (
          <StatusPill tone={tone.tone}>
            <Activity size={12} /> {tone.label}
          </StatusPill>
        ) : null
      }
    >
      {loading ? (
        <div style={{ height: 100, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : isError || !data ? (
        <EmptyState
          icon={<AlertCircle size={28} color={t.warn} />}
          title="Status unavailable"
          subtitle="Could not load EG sync health right now."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
          className="admin-v2-eg-grid"
        >
          <StatTile label="Connected" value={data.total_connected ?? 0} />
          <StatTile label="OK" value={data.status_ok_count ?? 0} />
          <StatTile label="Auth failed" value={data.auth_failed ?? 0} />
          <StatTile
            label="Last cron"
            value={
              cronHours == null
                ? '—'
                : cronHours < 1
                ? '< 1h ago'
                : `${Math.round(cronHours)}h ago`
            }
          />
        </div>
      )}
      <style>{`
        @media (min-width: 640px) {
          .admin-v2-eg-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </Card>
  );
}
