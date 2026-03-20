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
        description="Which pages are most visited and how long users spend on each"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Total Page Views"   value={data?.totalPageViews ?? 0}   icon={Eye}          isLoading={isLoading} />
        <AdminKpiCard title="Most Visited Page"  value={data?.mostVisitedPage ?? '—'} icon={Map}         iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Avg Session (sec)"  value={data?.avgSessionDuration ?? 0} icon={Clock}      iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Most Tapped Tab"    value={data?.mostTappedTab ?? '—'}   icon={MousePointer} iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
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

      {/* Page views table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Pages Ranked by Views" />
        {isLoading ? (
          <ChartSkeleton height={200} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">Path</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Views</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Unique Users</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Avg Time (sec)</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pageTable ?? []).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="py-2 px-3 font-mono text-[12px]">{p.path}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{p.views.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{p.uniqueUsers.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{p.avgTimeSec}</td>
                  </tr>
                ))}
                {(!data?.pageTable?.length) && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#94A3B8]">No page view data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nav tab taps */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Nav Tab Taps" />
        {isLoading ? (
          <ChartSkeleton height={120} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">Tab</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Taps</th>
                </tr>
              </thead>
              <tbody>
                {(data?.navTabs ?? []).map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="py-2 px-3 capitalize">{t.tab}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{t.count.toLocaleString()}</td>
                  </tr>
                ))}
                {(!data?.navTabs?.length) && (
                  <tr><td colSpan={2} className="py-8 text-center text-[#94A3B8]">No nav data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
