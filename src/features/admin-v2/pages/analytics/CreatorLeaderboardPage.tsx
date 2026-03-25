import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Heart, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  useCreatorLeaderboard,
  type AnalyticsPeriod,
} from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CreatorLeaderboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data: creators = [], isLoading, isError } = useCreatorLeaderboard(period);
  const navigate = useNavigate();

  const activeCreators = creators.length;
  const totalEngagement = creators.reduce((s, c) => s + c.totalEngagement, 0);
  const avgRate = activeCreators > 0
    ? Math.round(creators.reduce((s, c) => s + c.engagementRate, 0) / activeCreators * 10) / 10
    : 0;
  const topCreator = creators[0]?.displayName ?? '—';

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-6xl mx-auto space-y-6">
      <AdminPageHeader
        title="Creator Leaderboard"
        description="Top creators ranked by engagement"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Active Creators" value={activeCreators} icon={Users} isLoading={isLoading} />
        <AdminKpiCard title="Total Engagement" value={totalEngagement} icon={TrendingUp} iconColor="#F5A623" isLoading={isLoading} />
        <AdminKpiCard title="Avg Engagement Rate" value={`${avgRate}%`} icon={Heart} iconColor="#F31260" isLoading={isLoading} />
        <AdminKpiCard title="Top Creator" value={topCreator} icon={Trophy} iconColor="#7C3AED" isLoading={isLoading} />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: '#FFFFFF', borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="p-5 pb-3">
          <AdminSectionHeader title="Creator Rankings" description="Ranked by total engagement score" />
        </div>

        {isLoading ? (
          <div className="p-5">
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-6 rounded" style={{ background: '#F1F5F9' }} />
                  <div className="h-8 w-8 rounded-lg" style={{ background: '#F1F5F9' }} />
                  <div className="flex-1 h-4 rounded" style={{ background: '#F1F5F9' }} />
                  <div className="h-4 w-12 rounded" style={{ background: '#F1F5F9' }} />
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="p-5">
            <p className="text-[13px]" style={{ color: '#94A3B8' }}>Failed to load creator data</p>
          </div>
        ) : !creators.length ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Users className="h-8 w-8" style={{ color: '#CBD5E1' }} />
            <p style={{ fontSize: 14, color: '#64748B' }}>No creators found in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B', width: 50 }}>#</th>
                  <th className="text-left px-3 py-3 font-semibold" style={{ color: '#64748B', minWidth: 200 }}>Creator</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 60 }}>Posts</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 60 }}>Likes</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 75 }}>Comments</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 75 }}>Followers</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 110 }}>Eng. Rate</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 70 }}>Score</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: '#64748B', width: 90 }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator, i) => (
                  <tr
                    key={creator.userId}
                    onClick={() => navigate(`/profile/${creator.userId}`)}
                    className={cn('cursor-pointer transition-colors', i < 3 && 'border-l-2 border-amber-400')}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-2.5 font-bold" style={{ color: '#334155', fontSize: 13 }}>
                      {i < 3 ? <span style={{ fontSize: 16 }}>{MEDALS[i]}</span> : i + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <SquircleAvatar size={28} src={creator.avatarUrl} alt={creator.displayName} />
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: '#334155', fontSize: 12.5 }}>
                            {creator.displayName}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {creator.username && (
                              <span className="truncate" style={{ color: '#94A3B8', fontSize: 11 }}>
                                @{creator.username}
                              </span>
                            )}
                            {creator.country && (
                              <span style={{ color: '#94A3B8', fontSize: 11 }}>
                                · {creator.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{creator.totalPosts}</td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{creator.totalLikes}</td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{creator.totalComments}</td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{creator.followerCount}</td>
                    <td className="text-center px-3 py-2.5">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, creator.engagementRate)}%`,
                              background: '#F5A623',
                            }}
                          />
                        </div>
                        <span style={{ color: '#64748B', fontSize: 11, minWidth: 32 }}>
                          {creator.engagementRate}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span className="font-bold" style={{ color: '#F5A623' }}>{creator.totalEngagement}</span>
                    </td>
                    <td className="text-right px-4 py-2.5 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: 11 }}>
                      {creator.joinedAt ? format(new Date(creator.joinedAt), 'MMM yyyy') : '—'}
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