import React, { useState } from 'react';
import { MessageCircle, UserPlus, Heart, Users } from 'lucide-react';
import { useSocialAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  SingleAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function SocialAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useSocialAnalytics(period);

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Social & Messaging"
        description="How much are people connecting, following, and messaging?"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Messages Sent" value={data?.messagesSent ?? 0} icon={MessageCircle} isLoading={isLoading} />
        <AdminKpiCard title="New Conversations" value={data?.newConversations ?? 0} icon={MessageCircle} iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Follow Actions" value={data?.followActions ?? 0} icon={UserPlus} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Friend Requests" value={data?.friendRequests ?? 0} icon={Heart} iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
      </div>

      {/* Daily messages */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Daily Messages" />
        <div className="min-h-[180px]">
          {isLoading
            ? <ChartSkeleton height={180} />
            : <SingleAreaChart data={data?.dailyMessages ?? []} color="#3b82f6" name="Messages" />
          }
        </div>
      </div>

      {/* Most followed users */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Most Followed Users" />
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded bg-muted" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Display Name</th>
                  <th className="py-2 text-right">Followers</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topFollowed ?? []).map((u, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 font-mono text-xs">@{u.username}</td>
                    <td className="py-2 pr-4">{u.displayName}</td>
                    <td className="py-2 text-right tabular-nums">{u.followerCount.toLocaleString()}</td>
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
