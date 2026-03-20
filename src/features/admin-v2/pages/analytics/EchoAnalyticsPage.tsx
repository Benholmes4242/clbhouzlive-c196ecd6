import React, { useState } from 'react';
import { Sparkles, Users, MessageSquare, TrendingUp } from 'lucide-react';
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
        description="What are users asking Echo and how much is it being used?"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title="Total Queries" value={data?.totalQueries ?? 0} icon={MessageSquare} isLoading={isLoading} />
        <AdminKpiCard title="Unique Users" value={data?.uniqueUsers ?? 0} icon={Users} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Avg / User" value={data?.avgPerUser ?? 0} icon={TrendingUp} iconColor="#3b82f6" isLoading={isLoading} />
      </div>

      {/* Daily query volume */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Echo Query Volume" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dailyTrend ?? []} color="#8b5cf6" name="Queries" />
          }
        </div>
      </div>

      {/* Query text table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Recent Echo Queries" />
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 rounded bg-muted" />)}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Query Text</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentQueries ?? []).map((q, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 text-xs max-w-[300px] truncate">{q.queryText}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{q.username ?? 'anon'}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
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
