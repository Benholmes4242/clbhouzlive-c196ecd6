import React, { useState } from 'react';
import { Activity, Zap, Users, Clock } from 'lucide-react';
import { useEngagementAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import { ChartSkeleton } from '../../components/shared/AdminAreaChart';
import { AdminBarChart } from '../../components/shared/AdminBarChart';
import { AdminStatRow } from '../../components/shared/AdminStatRow';

// Event category colour mapping
function getEventColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('like') || n.includes('comment') || n.includes('share') || n.includes('follow') || n.includes('react')) return '#F5A623';
  if (n.includes('page') || n.includes('nav') || n.includes('tab') || n.includes('session')) return '#1D6FF5';
  if (n.includes('post') || n.includes('review') || n.includes('upload') || n.includes('echo')) return '#17C964';
  return '#94A3B8';
}

export default function EngagementAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useEngagementAnalytics(period);

  const maxEventCount = (data?.topEvents ?? [])[0]?.count ?? 1;

  // Peak hours heatmap data
  const hourly = data?.hourlyBreakdown ?? [];
  const maxHourCount = Math.max(...hourly.map(h => h.count), 1);

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

      {/* Daily event volume — bar chart */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Daily Event Volume" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <AdminBarChart
                data={(data?.dailyTrend ?? []).map(d => ({ label: d.date, value: d.value }))}
                color="#3b82f6"
                height={200}
              />
          }
        </div>
      </div>

      {/* Peak Hours heatmap */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Peak Hours" />
        {isLoading ? (
          <ChartSkeleton height={80} />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {hourly.map(h => {
              const intensity = maxHourCount > 0 ? h.count / maxHourCount : 0;
              return (
                <div
                  key={h.hour}
                  title={`${h.hour}:00 — ${h.count.toLocaleString()} events`}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: `rgba(245,158,11,${Math.max(0.05, intensity * 0.85)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600,
                    color: intensity > 0.5 ? '#FFFFFF' : '#94A3B8',
                    cursor: 'default',
                  }}
                >
                  {h.hour}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top events as stat rows */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Top 20 Events by Frequency" />
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 rounded" style={{ background: '#F1F5F9' }} />)}
          </div>
        ) : (
          <div>
            {(data?.topEvents ?? []).map((e, i) => (
              <AdminStatRow
                key={i}
                label={e.name}
                value={e.count.toLocaleString()}
                subValue={`${e.uniqueUsers} users`}
                barPct={(e.count / maxEventCount) * 100}
                color={getEventColor(e.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
