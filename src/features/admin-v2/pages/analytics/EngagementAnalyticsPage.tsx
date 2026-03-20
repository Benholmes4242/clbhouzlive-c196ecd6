import React, { useState } from 'react';
import { Activity, Zap, Users, Clock } from 'lucide-react';
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
        <AdminKpiCard title="Total Events" value={data?.totalEvents ?? 0} icon={Activity} isLoading={isLoading} />
        <AdminKpiCard title="Avg / User / Day" value={data?.avgEventsPerUserPerDay ?? 0} icon={Zap} iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Unique Users" value={data?.uniqueUsers ?? 0} icon={Users} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Busiest Hour" value={data?.busiestHour !== undefined ? `${data.busiestHour}:00` : '—'} icon={Clock} iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
      </div>

      {/* Daily event volume */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Event Volume" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dailyTrend ?? []} color="#3b82f6" name="Events" />
          }
        </div>
      </div>

      {/* Top events table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Top 20 Events by Frequency" />
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 rounded bg-muted" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Event Name</th>
                  <th className="py-2 pr-4 text-right">Count</th>
                  <th className="py-2 text-right">Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topEvents ?? []).map((e, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 font-mono text-xs">{e.name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{e.count.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">{e.uniqueUsers.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
