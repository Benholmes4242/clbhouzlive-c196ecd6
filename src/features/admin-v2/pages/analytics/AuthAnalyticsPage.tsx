import React, { useState } from 'react';
import { Shield, UserX, LogIn, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuthAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  DualAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function AuthAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useAuthAnalytics(period);

  const onboardingPct = data
    ? Math.round((data.onboardingComplete / Math.max(data.onboardingTotal, 1)) * 100)
    : 0;

  const signupTrend = (data?.signupSuccessTrend ?? []).map((s, i) => ({
    date:    s.date,
    success: s.value,
    failed:  data?.signupFailTrend?.[i]?.value ?? 0,
  }));

  const loginTrend = (data?.loginSuccessTrend ?? []).map((s, i) => ({
    date:    s.date,
    success: s.value,
    failed:  data?.loginFailTrend?.[i]?.value ?? 0,
  }));

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">

      <AdminPageHeader
        title="Auth & Security"
        description="Authentication events, onboarding, and profile health"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Signups"       value={data?.totalSignups ?? 0}  icon={Shield} isLoading={isLoading} />
        <AdminKpiCard
          title="Signup Fail %"
          value={`${data?.signupFailRate ?? 0}%`}
          icon={UserX}
          iconColor={(data?.signupFailRate ?? 0) > 10 ? 'hsl(var(--destructive))' : '#f59e0b'}
          isLoading={isLoading}
        />
        <AdminKpiCard title="Logins"        value={data?.totalLogins ?? 0}   icon={LogIn}  iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard
          title="Login Fail %"
          value={`${data?.loginFailRate ?? 0}%`}
          icon={AlertTriangle}
          iconColor={(data?.loginFailRate ?? 0) > 5 ? 'hsl(var(--destructive))' : '#64748b'}
          isLoading={isLoading}
        />
      </div>

      {/* Signup trend */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Signup Events" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <DualAreaChart
                data={signupTrend}
                series={[
                  { key: 'success', name: 'Success', color: '#22c55e' },
                  { key: 'failed',  name: 'Failed',  color: 'hsl(var(--destructive))' },
                ]}
              />
          }
        </div>
      </div>

      {/* Login trend */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Login Events" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <DualAreaChart
                data={loginTrend}
                series={[
                  { key: 'success', name: 'Success', color: '#3b82f6' },
                  { key: 'failed',  name: 'Failed',  color: 'hsl(var(--destructive))' },
                ]}
              />
          }
        </div>
      </div>

      {/* Onboarding completion */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Onboarding Completion" />
        <div>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded-md" />
              <div className="h-3 w-full bg-muted rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-muted-foreground">Completion rate</span>
                <span className="text-[15px] font-bold text-foreground">{onboardingPct}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${onboardingPct}%`,
                    backgroundColor: onboardingPct > 80
                      ? '#22c55e'
                      : onboardingPct > 50
                        ? 'hsl(var(--accent-amber))'
                        : 'hsl(var(--destructive))',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile issues */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Profile Issues" />
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 bg-muted rounded-md" />
                    <div className="h-3 w-20 bg-muted rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.profileIssues?.length ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No profile issues found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.profileIssues.map(issue => (
                <div key={issue.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {issue.username ? `@${issue.username}` : issue.id.slice(0, 8) + '…'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{issue.issue}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
