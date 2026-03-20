import React, { useState } from 'react';
import { MessageCircle, Users, UserPlus, Heart } from 'lucide-react';
import { useSocialAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  SingleAreaChart, DualAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function SocialAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useSocialAnalytics(period);

  const messageTrend = (data?.messagesTrend ?? []).map((m, i) => ({
    date: m.date,
    messages: m.value,
    conversations: data?.conversationsTrend?.[i]?.value ?? 0,
  }));

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Social & Messaging"
        description="How users connect, follow, and communicate"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Messages Sent"       value={data?.messagesSent ?? 0}       icon={MessageCircle} isLoading={isLoading} />
        <AdminKpiCard title="New Conversations"   value={data?.newConversations ?? 0}   icon={Users}         iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Follow Actions"       value={data?.followActions ?? 0}      icon={UserPlus}      iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Total Follows"        value={data?.totalFollows ?? 0}       icon={Heart}         iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
      </div>

      {/* Messages vs conversations */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Messages vs New Conversations" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <DualAreaChart
                data={messageTrend}
                series={[
                  { key: 'messages', name: 'Messages', color: '#3b82f6' },
                  { key: 'conversations', name: 'Conversations', color: '#22c55e' },
                ]}
              />
          }
        </div>
      </div>

      {/* Most followed users */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Most Followed Users" />
        {isLoading ? (
          <ChartSkeleton height={200} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">Username</th>
                  <th className="text-left py-2 px-3 font-semibold text-[#64748B]">Display Name</th>
                  <th className="text-right py-2 px-3 font-semibold text-[#64748B]">Followers</th>
                </tr>
              </thead>
              <tbody>
                {(data?.mostFollowed ?? []).map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="py-2 px-3 font-mono text-[12px]">@{u.username}</td>
                    <td className="py-2 px-3">{u.displayName}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{u.followerCount.toLocaleString()}</td>
                  </tr>
                ))}
                {(!data?.mostFollowed?.length) && (
                  <tr><td colSpan={3} className="py-8 text-center text-[#94A3B8]">No follow data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
