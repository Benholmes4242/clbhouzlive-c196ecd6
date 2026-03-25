import React, { useState } from 'react';
import { Users, Activity, TrendingUp, Zap } from 'lucide-react';
import { usePlatformAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  SingleAreaChart, DualAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function PlatformAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = usePlatformAnalytics(period);

  const combinedTrend = (data?.signupTrend ?? []).map((s, i) => ({
    date:    s.date,
    signups: s.value,
    dau:     data?.dau?.[i]?.value ?? 0,
  }));

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">

      <AdminPageHeader
        title="Platform Analytics"
        description="User growth, engagement, and activity trends"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip — row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Total Users"     value={data?.totalUsers ?? 0}    icon={Users}      isLoading={isLoading} />
        <AdminKpiCard title="New This Period"  value={data?.newThisPeriod ?? 0} icon={TrendingUp} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Avg DAU"          value={data?.avgDau ?? 0}        icon={Activity}   iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Peak DAU"         value={data?.peakDau ?? 0}       icon={Zap}        iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
      </div>

      {/* KPI strip — row 2: WAU, MAU, Stickiness */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title="WAU"  value={data?.wau ?? 0}  icon={Users} iconColor="#7C3AED" isLoading={isLoading} />
        <AdminKpiCard title="MAU"  value={data?.mau ?? 0}  icon={Users} iconColor="#0891B2" isLoading={isLoading} />
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <div>
                <AdminKpiCard
                  title="Stickiness"
                  value={`${data?.dauMauRatio ?? 0}%`}
                  icon={Zap}
                  iconColor="#F59E0B"
                  isLoading={isLoading}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px]">
              <p className="text-xs">DAU/MAU ratio. Above 20% indicates strong habit formation. Facebook ~60%, Instagram ~50%.</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Signups trend */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="New Signups" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.signupTrend ?? []} color="#22c55e" name="Signups" />
          }
        </div>
      </div>

      {/* DAU trend */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Active Users" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dau ?? []} color="#3b82f6" name="DAU" />
          }
        </div>
      </div>

      {/* WAU trend */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="WAU Trend (Rolling 7-day)" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.wauTrend ?? []} color="#7C3AED" name="WAU" />
          }
        </div>
      </div>

      {/* Combined overlay */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Signups vs DAU" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <DualAreaChart
                data={combinedTrend}
                series={[
                  { key: 'signups', name: 'Signups', color: '#22c55e' },
                  { key: 'dau',     name: 'DAU',     color: '#3b82f6' },
                ]}
              />
          }
        </div>
      </div>

    </div>
  );
}
