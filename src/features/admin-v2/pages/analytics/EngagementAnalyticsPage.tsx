import React, { useState } from 'react';
import { Activity, Zap, Clock, BarChart2 } from 'lucide-react';
import { useEngagementAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  SingleAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function EngagementAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useEngagementAnalytics(period);

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Engagement Analytics"
        description="What are users doing inside the app?"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Total Events"       value={data?.totalEvents ?? 0}       icon={Activity}  isLoading={isLoading} />
        <AdminKpiCard title="Avg Events/User/Day" value={data?.avgEventsPerUserDay ?? 0} icon={Zap}     iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Most Active User"    value={data?.mostActiveUser ?? '—'}   icon={BarChart2} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Busiest Hour"        value={data?.busiestHour !== undefined ? `${data.busiestHour}:00` : '—'} icon={Clock} iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
      </div>

      {/* Daily event volume */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Event Volume" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dailyVolume ?? []} color="#3b82f6" name="Events" />
          }
        </div>
      </div>

      {/* Top events table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Top 20 Events by Frequency" />
        {isLoading ? (
          <ChartSkeleton height={200} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">Event Name</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Count</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topEvents ?? []).map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="py-2 px-3 font-mono text-[12px]">{e.name}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{e.count.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{e.uniqueUsers.toLocaleString()}</td>
                  </tr>
                ))}
                {(!data?.topEvents?.length) && (
                  <tr><td colSpan={3} className="py-8 text-center text-[#94A3B8]">No events recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
