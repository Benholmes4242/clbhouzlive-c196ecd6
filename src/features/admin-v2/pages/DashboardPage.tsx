import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, UserPlus, Activity, FileText, CheckCircle,
  Mail, AlertTriangle, RefreshCw, Shield, Clock,
  ArrowRight, MapPin, Trophy, Upload, ClipboardList,
  Settings, BarChart3, Building2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdminV2Dashboard } from '../hooks/useAdminV2Dashboard';
import {
  AdminKpiCard,
  AdminPageHeader,
  AdminButton,
  AdminSectionHeader,
} from '../components/ui';
import { AdminBarChart } from '../components/shared/AdminBarChart';
import { AdminStatRow } from '../components/shared/AdminStatRow';
import EgSyncHealthCard from '../components/EgSyncHealthCard';

// ─── Action colour pill for audit log ────────────────────────────────────────

function AuditActionPill({ action }: { action: string }) {
  const lower = action.toLowerCase();
  const isCreate = lower.includes('creat') || lower.includes('add') || lower.includes('invit');
  const isDelete = lower.includes('delet') || lower.includes('remov') || lower.includes('ban') || lower.includes('revok');
  const isUpdate = lower.includes('updat') || lower.includes('edit') || lower.includes('chang') || lower.includes('approv') || lower.includes('reject');

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
      style={
        isCreate ? { background: '#F0FDF4', color: '#17C964' }
        : isDelete ? { background: '#FFF1F2', color: '#F31260' }
        : isUpdate ? { background: '#EFF6FF', color: '#1D6FF5' }
        : { background: '#F1F5F9', color: '#94A3B8' }
      }
    >
      {isCreate ? 'CREATE' : isDelete ? 'DELETE' : isUpdate ? 'UPDATE' : 'SYS'}
    </span>
  );
}

function getAuditBorderColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('creat') || lower.includes('add') || lower.includes('invit')) return '#17C964';
  if (lower.includes('delet') || lower.includes('remov') || lower.includes('ban') || lower.includes('revok')) return '#F31260';
  if (lower.includes('updat') || lower.includes('edit') || lower.includes('chang') || lower.includes('approv') || lower.includes('reject')) return '#1D6FF5';
  return '#E2E8F0';
}

// ─── Queue card ───────────────────────────────────────────────────────────────

function QueueCard({
  label,
  count,
  icon: Icon,
  href,
  variant = 'default',
  isLoading,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'warning' | 'danger';
  isLoading?: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        className="p-5 space-y-3 animate-pulse"
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14 }}
      >
        <div className="h-8 w-8 rounded-lg" style={{ background: '#F1F5F9' }} />
        <div className="h-6 w-12 rounded" style={{ background: '#F1F5F9' }} />
        <div className="h-4 w-24 rounded" style={{ background: '#F1F5F9' }} />
      </div>
    );
  }

  const hasItems = count > 0;

  return (
    <button
      onClick={() => navigate(href)}
      className="w-full text-left p-5 transition-all duration-150 active:scale-[0.98]"
      style={{
        borderRadius: 14,
        background: hasItems && variant === 'danger' ? '#FFF1F2'
          : hasItems && variant === 'warning' ? '#FFF7ED'
          : '#FFFFFF',
        border: `1px solid ${
          hasItems && variant === 'danger' ? '#FECDD3'
          : hasItems && variant === 'warning' ? '#FED7AA'
          : '#E2E8F0'
        }`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F1F5F9' }}>
          <Icon className="h-4 w-4" style={{ color: variant === 'danger' ? '#F31260' : variant === 'warning' ? '#F5A623' : '#94A3B8' }} />
        </div>
        <ArrowRight className="h-3.5 w-3.5" style={{ color: '#94A3B8' }} />
      </div>
      <div>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: -0.5 }}>
          {count}
        </span>
        <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{label}</p>
      </div>
    </button>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
  label,
  icon: Icon,
  href,
  color = '#94A3B8',
}: {
  label: string;
  icon: React.ElementType;
  href: string;
  color?: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="flex flex-col items-center gap-2.5 p-4 transition-all duration-150 active:scale-[0.97] group"
      style={{
        borderRadius: 14,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="h-4.5 w-4.5" style={{ color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>
        {label}
      </span>
    </button>
  );
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2" style={{ fontSize: 12 }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: '#64748B' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Health status dot ────────────────────────────────────────────────────────

function HealthIndicator({ label, status, value }: { label: string; status: 'good' | 'warn'; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: status === 'good' ? '#17C964' : '#F5A623' }}
      />
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</p>
        <p style={{ fontSize: 11, color: '#94A3B8' }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { kpis, queue, trend, audit, glance, egSyncHealth, isAnyLoading, refetchAll } = useAdminV2Dashboard();
  const navigate = useNavigate();
  const [seriesVisible, setSeriesVisible] = useState({
    users: true, posts: true, reviews: true,
  });

  const toggleSeries = (key: keyof typeof seriesVisible) => {
    setSeriesVisible(v => ({ ...v, [key]: !v[key] }));
  };

  // Derive health indicators
  const health = [
    { label: 'Signups', status: ((kpis.data?.newUsersToday.delta ?? 0) >= 0 ? 'good' : 'warn') as 'good' | 'warn', value: `${kpis.data?.newUsersToday.value ?? 0} today` },
    { label: 'Active Users', status: ((kpis.data?.activeUsers24h.delta ?? 0) >= -10 ? 'good' : 'warn') as 'good' | 'warn', value: `${kpis.data?.activeUsers24h.value ?? 0} (24h)` },
    { label: 'Content', status: ((kpis.data?.postsToday.delta ?? 0) >= -20 ? 'good' : 'warn') as 'good' | 'warn', value: `${kpis.data?.postsToday.value ?? 0} posts` },
    { label: 'Action Queue', status: ((queue.data?.pendingVerifications ?? 0) > 5 ? 'warn' : 'good') as 'good' | 'warn', value: `${(queue.data?.pendingVerifications ?? 0) + (queue.data?.pendingInvites ?? 0)} pending` },
  ];

  return (
    <div style={{ padding: '24px 24px 40px', background: '#F8FAFC', minHeight: '100%' }}>
      <div className="space-y-8 max-w-[1400px]">

      {/* Page header */}
      <AdminPageHeader
        title="Dashboard"
        description="Platform overview and action queues"
        action={
          <AdminButton
            icon={RefreshCw}
            variant="outline"
            size="sm"
            loading={isAnyLoading}
            onClick={refetchAll}
          >
            Refresh
          </AdminButton>
        }
      />

      {/* ── Platform Health Banner ─────────────────────────────────────────── */}
      <div
        style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
          padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {kpis.isLoading ? (
          <div className="flex items-center gap-8 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F1F5F9' }} />
                <div className="h-4 w-20 rounded" style={{ background: '#F1F5F9' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-8 flex-wrap" style={{ rowGap: 12 }}>
            {health.map((h, i) => (
              <React.Fragment key={h.label}>
                {i > 0 && <div style={{ width: 1, height: 28, background: '#F1F5F9', flexShrink: 0 }} />}
                <HealthIndicator {...h} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 1: KPI Row ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <AdminSectionHeader title="Key Metrics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminKpiCard
            title="Total Users"
            value={kpis.data?.totalUsers.value ?? 0}
            delta={kpis.data?.totalUsers.delta}
            deltaLabel="vs yesterday"
            icon={Users}
            iconColor="#F5A623"
            trend={kpis.data?.totalUsers.trend}
            isLoading={kpis.isLoading}
            onClick={() => navigate('/admin-v2/users')}
          />
          <AdminKpiCard
            title="New Users Today"
            value={kpis.data?.newUsersToday.value ?? 0}
            delta={kpis.data?.newUsersToday.delta}
            deltaLabel="vs yesterday"
            icon={UserPlus}
            iconColor="#1D6FF5"
            isLoading={kpis.isLoading}
            onClick={() => navigate('/admin-v2/users?filter=new_today')}
          />
          <AdminKpiCard
            title="Active Users (24h)"
            value={kpis.data?.activeUsers24h.value ?? 0}
            delta={kpis.data?.activeUsers24h.delta}
            deltaLabel="vs prior 24h"
            icon={Activity}
            iconColor="#17C964"
            isLoading={kpis.isLoading}
            onClick={() => navigate('/admin-v2/users?filter=active_24h')}
          />
          <AdminKpiCard
            title="Posts Today"
            value={kpis.data?.postsToday.value ?? 0}
            delta={kpis.data?.postsToday.delta}
            deltaLabel="vs yesterday"
            icon={FileText}
            iconColor="#7C3AED"
            isLoading={kpis.isLoading}
            onClick={() => navigate('/admin-v2/analytics/content')}
          />
        </div>
      </section>

      {/* ── Today at a Glance ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <AdminSectionHeader title="Today at a Glance" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Posts by Hour */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              Posts by Hour
            </p>
            {glance.isLoading ? (
              <div className="h-[140px] animate-pulse rounded-lg" style={{ background: '#F1F5F9' }} />
            ) : (
              <AdminBarChart
                data={(glance.data?.postsByHour ?? []).map(h => ({
                  label: `${h.hour}:00`,
                  value: h.count,
                }))}
                color="#F5A623"
                height={140}
              />
            )}
          </div>

          {/* Top Active Users */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              Most Active Users Today
            </p>
            {glance.isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded" style={{ background: '#F1F5F9' }} />)}
              </div>
            ) : !glance.data?.topActiveUsers?.length ? (
              <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>No activity yet today</p>
            ) : (
              <div>
                {glance.data.topActiveUsers.map((u, i) => (
                  <AdminStatRow
                    key={u.userId}
                    label={`${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${u.displayName}`}
                    value={u.eventCount}
                    subValue="events"
                    barPct={glance.data!.topActiveUsers[0]?.eventCount
                      ? (u.eventCount / glance.data!.topActiveUsers[0].eventCount) * 100
                      : 0}
                    color={i === 0 ? '#F5A623' : i === 1 ? '#1D6FF5' : '#17C964'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: Action Queues ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <AdminSectionHeader title="Action Queue" description="Items requiring your attention" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QueueCard
            label="Pending Verifications"
            count={queue.data?.pendingVerifications ?? 0}
            icon={CheckCircle}
            href="/admin-v2/verifications"
            variant={(queue.data?.pendingVerifications ?? 0) > 5 ? 'danger' : (queue.data?.pendingVerifications ?? 0) > 0 ? 'warning' : 'default'}
            isLoading={queue.isLoading}
          />
          <QueueCard
            label="Pending Invites"
            count={queue.data?.pendingInvites ?? 0}
            icon={Mail}
            href="/admin-v2/invites"
            isLoading={queue.isLoading}
          />
          <QueueCard
            label="Expiring Access (7d)"
            count={queue.data?.expiringAccess ?? 0}
            icon={AlertTriangle}
            href="/admin-v2/team"
            variant={(queue.data?.expiringAccess ?? 0) > 0 ? 'warning' : 'default'}
            isLoading={queue.isLoading}
          />
        </div>
      </section>

      {/* ── Section 3: Activity Trend Chart (ComposedChart) ─────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <AdminSectionHeader title="14-Day Activity" />
          {/* Series toggles */}
          <div className="flex items-center gap-1.5">
            {([
              { key: 'users',   label: 'Signups', color: '#F5A623' },
              { key: 'posts',   label: 'Posts',   color: '#1D6FF5' },
              { key: 'reviews', label: 'Reviews', color: '#17C964' },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-all"
                style={seriesVisible[s.key]
                  ? { background: '#F1F5F9', color: '#334155', borderRadius: 20 }
                  : { color: '#94A3B8', borderRadius: 20, opacity: 0.5 }
                }
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, opacity: seriesVisible[s.key] ? 1 : 0.3 }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {trend.isLoading ? (
            <div className="h-[260px] animate-pulse rounded-lg" style={{ background: '#F1F5F9' }} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trend.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                {seriesVisible.users && (
                  <Bar dataKey="users" name="Signups" fill="#F5A623" radius={[3, 3, 0, 0]} maxBarSize={20} opacity={0.85} />
                )}
                {seriesVisible.posts && (
                  <Bar dataKey="posts" name="Posts" fill="#1D6FF5" radius={[3, 3, 0, 0]} maxBarSize={20} opacity={0.85} />
                )}
                {seriesVisible.reviews && (
                  <Line type="monotone" dataKey="reviews" name="Reviews" stroke="#17C964" strokeWidth={2} dot={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Section 4: Recent Admin Activity ─────────────────────────────────── */}
      <section className="space-y-3">
        <AdminSectionHeader
          title="Recent Admin Activity"
          action={
            <AdminButton
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/admin-v2/audit')}
            >
              View audit log
            </AdminButton>
          }
        />
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {audit.isLoading ? (
            <div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <div className="h-5 w-16 rounded" style={{ background: '#F1F5F9' }} />
                  <div className="h-4 w-48 rounded" style={{ background: '#F1F5F9' }} />
                  <div className="h-4 w-24 rounded ml-auto" style={{ background: '#F1F5F9' }} />
                </div>
              ))}
            </div>
          ) : !audit.data?.length ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                <Shield className="h-5 w-5" style={{ color: '#94A3B8' }} />
              </div>
              <p style={{ fontSize: 14, color: '#64748B' }}>No recent admin activity</p>
            </div>
          ) : (
            <div>
              {audit.data.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    borderLeft: `3px solid ${getAuditBorderColor(entry.action)}`,
                    minHeight: 52,
                  }}
                >
                  <AuditActionPill action={entry.action} />
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                    {entry.targetEmail && (
                      <span className="ml-2" style={{ fontSize: 12, color: '#64748B' }}>
                        {entry.targetEmail}
                      </span>
                    )}
                  </div>
                  <span className="whitespace-nowrap flex items-center gap-1" style={{ fontSize: 11, color: '#94A3B8' }}>
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 5: Quick Actions ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <AdminSectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <QuickAction label="Users" icon={Users} href="/admin-v2/users" color="#7C3AED" />
          <QuickAction label="Courses" icon={MapPin} href="/admin-v2/courses" color="#17C964" />
          <QuickAction label="Import" icon={Upload} href="/admin-v2/courses/import" color="#F5A623" />
          <QuickAction label="Verifications" icon={CheckCircle} href="/admin-v2/verifications" color="#1D6FF5" />
          <QuickAction label="Tour Data" icon={Trophy} href="/admin-v2/tour" color="#F5A623" />
          <QuickAction label="Businesses" icon={Building2} href="/admin-v2/businesses" color="#F31260" />
          <QuickAction label="Audit Log" icon={ClipboardList} href="/admin-v2/audit" color="#7C3AED" />
          <QuickAction label="Settings" icon={Settings} href="/admin-v2/settings" color="#64748B" />
        </div>
      </section>

      </div>
    </div>
  );
}
