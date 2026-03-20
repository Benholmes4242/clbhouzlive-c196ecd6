import React, { useState } from 'react';
import { Sparkles, Users, MessageCircle, Hash } from 'lucide-react';
import { useEchoAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  SingleAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function EchoAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useEchoAnalytics(period);

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Echo AI Analytics"
        description="What users are asking Echo — the most valuable signal"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title="Total Echo Queries" value={data?.totalQueries ?? 0}  icon={MessageCircle} isLoading={isLoading} />
        <AdminKpiCard title="Unique Users"       value={data?.uniqueUsers ?? 0}   icon={Users}         iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Avg Queries/User"   value={data?.avgPerUser ?? 0}    icon={Sparkles}      iconColor="#22c55e" isLoading={isLoading} />
      </div>

      {/* Daily echo volume */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Echo Queries" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dailyVolume ?? []} color="#8b5cf6" name="Queries" />
          }
        </div>
      </div>

      {/* Query text table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Recent Echo Queries" />
        {isLoading ? (
          <ChartSkeleton height={300} />
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-card">
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">Query</th>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">User</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentQueries ?? []).map((q, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="py-2 px-3 max-w-[400px] truncate">{q.queryText}</td>
                    <td className="py-2 px-3 text-[#64748B]">{q.username || '—'}</td>
                    <td className="py-2 px-3 text-right text-[#94A3B8] whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {(!data?.recentQueries?.length) && (
                  <tr><td colSpan={3} className="py-8 text-center text-[#94A3B8]">No Echo queries recorded yet. Add echo_query tracking to start capturing data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
