import React, { useState } from 'react';
import { Map, Eye, Clock, MousePointer } from 'lucide-react';
import { useNavigationAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  SingleAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function NavigationAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useNavigationAnalytics(period);

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Pages & Navigation"
        description="Which pages are most visited and how long do users spend on each?"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Page Views" value={data?.totalPageViews ?? 0} icon={Eye} isLoading={isLoading} />
        <AdminKpiCard title="Most Visited" value={data?.mostVisitedPage ?? '—'} icon={Map} iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Avg Duration" value={data?.avgSessionDuration ? `${data.avgSessionDuration}s` : '—'} icon={Clock} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Top Nav Tab" value={data?.topNavTab ?? '—'} icon={MousePointer} iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
      </div>

      {/* Daily page views */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Page Views" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dailyPageViews ?? []} color="#3b82f6" name="Views" />
          }
        </div>
      </div>

      {/* Pages table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Page Views by Path" />
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 rounded bg-muted" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Path</th>
                  <th className="py-2 pr-4 text-right">Views</th>
                  <th className="py-2 pr-4 text-right">Unique Users</th>
                  <th className="py-2 text-right">Avg Time (s)</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pageBreakdown ?? []).map((p, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 font-mono text-xs">{p.path}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{p.views.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{p.uniqueUsers.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">{p.avgDuration ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nav tab taps */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Nav Tab Taps" />
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded bg-muted" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Tab</th>
                  <th className="py-2 text-right">Taps</th>
                </tr>
              </thead>
              <tbody>
                {(data?.navTabBreakdown ?? []).map((t, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 capitalize">{t.tab}</td>
                    <td className="py-2 text-right tabular-nums">{t.count.toLocaleString()}</td>
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
