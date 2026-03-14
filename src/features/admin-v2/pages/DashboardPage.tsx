import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis,
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

// ─── Action colour pill for audit log ────────────────────────────────────────

function AuditActionPill({ action }: { action: string }) {
  const lower = action.toLowerCase();
  const isCreate = lower.includes('creat') || lower.includes('add') || lower.includes('invit');
  const isDelete = lower.includes('delet') || lower.includes('remov') || lower.includes('ban') || lower.includes('revok');
  const isUpdate = lower.includes('updat') || lower.includes('edit') || lower.includes('chang') || lower.includes('approv') || lower.includes('reject');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase',
        isCreate && 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
        isDelete && 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        isUpdate && 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
        !isCreate && !isDelete && !isUpdate && 'bg-muted text-muted-foreground',
      )}
    >
      {isCreate ? 'CREATE' : isDelete ? 'DELETE' : isUpdate ? 'UPDATE' : 'SYS'}
    </span>
  );
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
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3 animate-pulse">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="h-6 w-12 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    );
  }

  const hasItems = count > 0;

  return (
    <button
      onClick={() => navigate(href)}
      className={cn(
        'w-full text-left rounded-xl border p-5 transition-all duration-150 active:scale-[0.98]',
        hasItems && variant === 'danger'
          ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5 hover:shadow-sm'
          : hasItems && variant === 'warning'
            ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-500/20 dark:bg-yellow-500/5 hover:shadow-sm'
            : 'border-border/60 bg-card hover:border-border hover:shadow-sm',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
          <Icon className="h-4 w-4" style={{ color: variant === 'danger' ? 'hsl(var(--destructive))' : variant === 'warning' ? '#f59e0b' : 'hsl(var(--muted-foreground))' }} />
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <span className="text-2xl font-bold text-foreground tracking-tight">
          {count}
        </span>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
  label,
  icon: Icon,
  href,
  color = 'hsl(var(--muted-foreground))',
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
      className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-150 active:scale-[0.97] group"
    >
      <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-muted transition-colors">
        <Icon className="h-4.5 w-4.5" style={{ color }} />
      </div>
      <span className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { kpis, queue, trend, audit, isAnyLoading, refetchAll } = useAdminV2Dashboard();
  const navigate = useNavigate();
  const [seriesVisible, setSeriesVisible] = useState({
    users: true, posts: true, reviews: true,
  });

  const toggleSeries = (key: keyof typeof seriesVisible) => {
    setSeriesVisible(v => ({ ...v, [key]: !v[key] }));
  };

  return (
    <div className="p-6 space-y-8 max-w-[1400px]">

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
            trend={kpis.data?.totalUsers.trend}
            isLoading={kpis.isLoading}
          />
          <AdminKpiCard
            title="New Users Today"
            value={kpis.data?.newUsersToday.value ?? 0}
            delta={kpis.data?.newUsersToday.delta}
            deltaLabel="vs yesterday"
            icon={UserPlus}
            isLoading={kpis.isLoading}
          />
          <AdminKpiCard
            title="Active Users (24h)"
            value={kpis.data?.activeUsers24h.value ?? 0}
            delta={kpis.data?.activeUsers24h.delta}
            deltaLabel="vs prior 24h"
            icon={Activity}
            isLoading={kpis.isLoading}
          />
          <AdminKpiCard
            title="Posts Today"
            value={kpis.data?.postsToday.value ?? 0}
            delta={kpis.data?.postsToday.delta}
            deltaLabel="vs yesterday"
            icon={FileText}
            isLoading={kpis.isLoading}
          />
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

      {/* ── Section 3: Activity Trend Chart ─────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <AdminSectionHeader title="14-Day Activity" />
          {/* Series toggles */}
          <div className="flex items-center gap-1.5">
            {([
              { key: 'users',   label: 'Signups', color: '#f59e0b' },
              { key: 'posts',   label: 'Posts',   color: '#3b82f6' },
              { key: 'reviews', label: 'Reviews', color: '#22c55e' },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                  seriesVisible[s.key]
                    ? 'bg-foreground/10 text-foreground'
                    : 'bg-muted/40 text-muted-foreground/50',
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, opacity: seriesVisible[s.key] ? 1 : 0.3 }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          {trend.isLoading ? (
            <div className="h-[260px] animate-pulse bg-muted/30 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend.data ?? []}>
                <defs>
                  <linearGradient id="grad-users" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-posts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-reviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                {seriesVisible.users && (
                  <Area type="monotone" dataKey="users" name="Signups" stroke="#f59e0b" fill="url(#grad-users)" strokeWidth={2} dot={false} />
                )}
                {seriesVisible.posts && (
                  <Area type="monotone" dataKey="posts" name="Posts" stroke="#3b82f6" fill="url(#grad-posts)" strokeWidth={2} dot={false} />
                )}
                {seriesVisible.reviews && (
                  <Area type="monotone" dataKey="reviews" name="Reviews" stroke="#22c55e" fill="url(#grad-reviews)" strokeWidth={2} dot={false} />
                )}
              </AreaChart>
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
        <div className="rounded-xl border border-border/60 bg-card">
          {audit.isLoading ? (
            <div className="divide-y divide-border/40">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                  <div className="h-5 w-16 rounded bg-muted" />
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted ml-auto" />
                </div>
              ))}
            </div>
          ) : !audit.data?.length ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No recent admin activity</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {audit.data.map(entry => (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5">
                  <AuditActionPill action={entry.action} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-foreground">
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                    {entry.targetEmail && (
                      <span className="text-[12px] text-muted-foreground ml-2">
                        {entry.targetEmail}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
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
          <QuickAction label="Users" icon={Users} href="/admin-v2/users" color="#6366f1" />
          <QuickAction label="Courses" icon={MapPin} href="/admin-v2/courses" color="#22c55e" />
          <QuickAction label="Import" icon={Upload} href="/admin-v2/courses/import" color="#f59e0b" />
          <QuickAction label="Verifications" icon={CheckCircle} href="/admin-v2/verifications" color="#3b82f6" />
          <QuickAction label="Tour Data" icon={Trophy} href="/admin-v2/tour" color="#eab308" />
          <QuickAction label="Businesses" icon={Building2} href="/admin-v2/businesses" color="#ec4899" />
          <QuickAction label="Audit Log" icon={ClipboardList} href="/admin-v2/audit" color="#8b5cf6" />
          <QuickAction label="Settings" icon={Settings} href="/admin-v2/settings" color="#64748b" />
        </div>
      </section>

    </div>
  );
}
