import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader, AdminKpiCard, AdminSectionHeader } from '../../components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CohortRow {
  cohortLabel: string;
  cohortSize: number;
  retention: (number | null)[];
}

interface RetentionData {
  cohorts: CohortRow[];
  d7Retention: number;
  d30Retention: number;
  avgSessionLength: number;
  churnRisk: number;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchRetentionData(): Promise<RetentionData> {
  const since = new Date();
  since.setDate(since.getDate() - 84); // 12 weeks

  const [usersRes, eventsRes] = await Promise.all([
    supabase.from('user_profiles').select('id, created_at').gte('created_at', since.toISOString()).is('deleted_at', null).limit(10000),
    supabase.from('analytics_events').select('user_id, created_at').gte('created_at', since.toISOString()).not('user_id', 'is', null).limit(50000),
  ]);

  const users = usersRes.data ?? [];
  const events = eventsRes.data ?? [];

  // Build week-indexed activity map
  const userActivity = new Map<string, Set<number>>();
  for (const e of events) {
    if (!e.user_id) continue;
    const weekNum = Math.floor((Date.now() - new Date(e.created_at).getTime()) / (7 * 24 * 3600_000));
    if (!userActivity.has(e.user_id)) userActivity.set(e.user_id, new Set());
    userActivity.get(e.user_id)!.add(weekNum);
  }

  // Group users by signup week cohort
  const cohorts: Record<number, string[]> = {};
  for (const u of users) {
    const signupWeek = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (7 * 24 * 3600_000));
    if (!cohorts[signupWeek]) cohorts[signupWeek] = [];
    cohorts[signupWeek].push(u.id);
  }

  // Build cohort rows
  const cohortRows = Object.entries(cohorts)
    .filter(([week]) => parseInt(week) <= 11)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([cohortWeek, userIds]) => {
      const weekNum = parseInt(cohortWeek);
      const retentionByWeek = Array.from({ length: 9 }, (_, offset) => {
        const targetWeek = weekNum - offset;
        if (targetWeek < 0) return null;
        const activeCount = userIds.filter(id => userActivity.get(id)?.has(targetWeek)).length;
        return userIds.length > 0 ? Math.round((activeCount / userIds.length) * 100) : 0;
      });

      return {
        cohortLabel: `Week of ${new Date(Date.now() - weekNum * 7 * 24 * 3600_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        cohortSize: userIds.length,
        retention: retentionByWeek,
      };
    });

  // D7 retention: users signed up 7-14 days ago, active in last 7 days
  const d7Users = users.filter(u => {
    const age = Date.now() - new Date(u.created_at).getTime();
    return age >= 7 * 86400_000 && age < 14 * 86400_000;
  });
  const d7Active = d7Users.filter(u => userActivity.get(u.id)?.has(0)).length;
  const d7Retention = d7Users.length > 0 ? Math.round((d7Active / d7Users.length) * 100) : 0;

  // D30 retention: users signed up 30-60 days ago, active in last 30 days
  const d30Users = users.filter(u => {
    const age = Date.now() - new Date(u.created_at).getTime();
    return age >= 30 * 86400_000 && age < 60 * 86400_000;
  });
  const d30Active = d30Users.filter(u => {
    const weeks = userActivity.get(u.id);
    if (!weeks) return false;
    return [...weeks].some(w => w < 5); // within ~30 days
  }).length;
  const d30Retention = d30Users.length > 0 ? Math.round((d30Active / d30Users.length) * 100) : 0;

  // Avg session length from page_exit duration_sec
  const { data: exitEvents } = await supabase
    .from('analytics_events')
    .select('props')
    .eq('name', 'page_exit')
    .gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString())
    .limit(5000);

  const durations = (exitEvents ?? [])
    .map(e => (e.props as any)?.duration_sec)
    .filter((d): d is number => typeof d === 'number' && d > 0 && d < 3600);
  const avgSessionLength = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Churn risk: active 8-14 days ago but zero events in last 7 days
  const churnRisk = users.filter(u => {
    const weeks = userActivity.get(u.id);
    if (!weeks) return false;
    const wasActive = weeks.has(1); // week 1 = 7-14 days ago
    const isActive = weeks.has(0);  // week 0 = last 7 days
    return wasActive && !isActive;
  }).length;

  return { cohorts: cohortRows, d7Retention, d30Retention, avgSessionLength, churnRisk };
}

// ─── Retention cell color ─────────────────────────────────────────────────────

function getCellColor(value: number | null): { bg: string; text: string } {
  if (value === null) return { bg: '#F8FAFC', text: '#CBD5E1' };
  if (value === 0) return { bg: '#FFFFFF', text: '#94A3B8' };
  if (value <= 25) return { bg: '#FFFBEB', text: '#92400E' };
  if (value <= 50) return { bg: '#FEF3C7', text: '#78350F' };
  if (value <= 75) return { bg: '#FDE68A', text: '#78350F' };
  return { bg: '#F59E0B', text: '#FFFFFF' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RetentionPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-v2', 'analytics', 'retention'],
    queryFn: fetchRetentionData,
    staleTime: 5 * 60_000,
  });

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-6xl mx-auto space-y-6">
      <AdminPageHeader
        title="Retention Analytics"
        description="Weekly cohort retention, churn risk, and session metrics"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard
          title="D7 Retention"
          value={data?.d7Retention ?? 0}
          format="percent"
          icon={TrendingDown}
          iconColor="#17C964"
          isLoading={isLoading}
        />
        <AdminKpiCard
          title="D30 Retention"
          value={data?.d30Retention ?? 0}
          format="percent"
          icon={TrendingDown}
          iconColor="#3b82f6"
          isLoading={isLoading}
        />
        <AdminKpiCard
          title="Avg Session (s)"
          value={data?.avgSessionLength ?? 0}
          icon={Clock}
          iconColor="#7C3AED"
          isLoading={isLoading}
        />
        <AdminKpiCard
          title="Churn Risk"
          value={data?.churnRisk ?? 0}
          icon={AlertTriangle}
          iconColor="#F31260"
          isLoading={isLoading}
        />
      </div>

      {/* Cohort table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="p-5 pb-3">
          <AdminSectionHeader title="Weekly Cohort Retention" description="% of users active in each week after signup" />
        </div>

        {isLoading ? (
          <div className="p-5">
            <div className="h-[300px] animate-pulse rounded-lg" style={{ background: '#F1F5F9' }} />
          </div>
        ) : isError ? (
          <div className="p-5">
            <p className="text-[13px]" style={{ color: '#94A3B8' }}>Failed to load retention data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B', minWidth: 140 }}>Cohort</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', minWidth: 50 }}>Size</th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i} className="text-center px-2 py-3 font-semibold" style={{ color: '#64748B', minWidth: 52 }}>
                      Wk {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.cohorts ?? []).map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: '#334155' }}>{row.cohortLabel}</td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#64748B' }}>{row.cohortSize}</td>
                    {row.retention.map((val, ci) => {
                      const { bg, text } = getCellColor(val);
                      return (
                        <td key={ci} className="text-center px-2 py-2.5">
                          <span
                            className="inline-flex items-center justify-center rounded-md font-semibold"
                            style={{ background: bg, color: text, width: 44, height: 28, fontSize: 11 }}
                          >
                            {val !== null ? `${val}%` : '—'}
                          </span>
                        </td>
                      );
                    })}
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
