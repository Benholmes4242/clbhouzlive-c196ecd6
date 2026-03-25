import React, { useState } from 'react';
import { Users, Activity, TrendingUp, Zap } from 'lucide-react';
import { ReferenceLine } from 'recharts';
import { usePlatformAnalytics, useGeoBreakdown, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  DualAreaChart, ChartSkeleton, SingleAreaChart,
} from '../../components/shared/AdminAreaChart';
import { AdminBarChart } from '../../components/shared/AdminBarChart';
import { AdminDonutChart } from '../../components/shared/AdminDonutChart';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { AdminChartTooltip, xAxisProps, yAxisProps, gridProps } from '../../components/shared/AdminAreaChart';

export default function PlatformAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = usePlatformAnalytics(period);
  const { data: geoData = [], isLoading: geoLoading } = useGeoBreakdown('90d');

  const combinedTrend = (data?.signupTrend ?? []).map((s, i) => ({
    date:    s.date,
    signups: s.value,
    dau:     data?.dau?.[i]?.value ?? 0,
  }));

  // Geo donut — top 5 countries
  const geoColors = ['#F5A623', '#1D6FF5', '#17C964', '#7C3AED', '#0891B2'];
  const top5Geo = geoData.slice(0, 5);
  const otherCount = geoData.slice(5).reduce((sum, g) => sum + g.userCount, 0);
  const donutData = [
    ...top5Geo.map((g, i) => ({ label: g.country, value: g.userCount, color: geoColors[i] })),
    ...(otherCount > 0 ? [{ label: 'Other', value: otherCount, color: '#CBD5E1' }] : []),
  ];
  const totalGeoUsers = donutData.reduce((s, d) => s + d.value, 0);

  // WAU trend as horizontal bar data (last 4 weeks)
  const wauBars = (data?.wauTrend ?? [])
    .filter((_, i) => i % 7 === 6 || i === (data?.wauTrend?.length ?? 1) - 1)
    .slice(-4)
    .map(d => ({ label: d.date, value: d.value }));

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

      {/* New Signups — bar chart */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="New Signups" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <AdminBarChart
                data={(data?.signupTrend ?? []).map(d => ({ label: d.date, value: d.value }))}
                color="#F5A623"
                height={200}
              />
          }
        </div>
      </div>

      {/* DAU trend with reference line */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Daily Active Users" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data?.dau ?? []}>
                  <defs>
                    <linearGradient id="grad-dau-plat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<AdminChartTooltip />} />
                  <ReferenceLine
                    y={data?.avgDau ?? 0}
                    stroke="#94A3B8"
                    strokeDasharray="4 4"
                    label={{ value: 'Avg', fontSize: 10, fill: '#94A3B8' }}
                  />
                  <Area type="monotone" dataKey="value" name="DAU" stroke="#3b82f6" fill="url(#grad-dau-plat)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* WAU trend — horizontal bar chart */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="WAU Trend (Rolling 7-day)" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <AdminBarChart data={wauBars} color="#7C3AED" height={180} horizontal />
          }
        </div>
      </div>

      {/* Combined overlay */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
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

      {/* User Geography donut */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="User Geography (90d)" />
        {geoLoading ? (
          <ChartSkeleton height={160} />
        ) : !donutData.length ? (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '32px 0' }}>No geographic data</p>
        ) : (
          <div className="flex items-center gap-8 flex-wrap">
            <AdminDonutChart
              data={donutData}
              size={160}
              innerRadius={48}
              centerValue={totalGeoUsers}
              centerLabel="Users"
            />
            <div className="flex-1 min-w-[140px] space-y-2">
              {donutData.map((d, i) => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
