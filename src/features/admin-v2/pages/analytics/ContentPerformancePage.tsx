import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, Video, Image, Layers, Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  useContentPerformance,
  type AnalyticsPeriod,
  type ContentPerformancePost,
} from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';

const MEDALS = ['🥇', '🥈', '🥉'];

function mediaIcon(type: ContentPerformancePost['mediaType']) {
  if (type === 'video') return <Video className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />;
  if (type === 'image') return <Image className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />;
  if (type === 'mixed') return <Layers className="w-3.5 h-3.5" style={{ color: '#0891B2' }} />;
  return null;
}

export default function ContentPerformancePage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data: posts = [], isLoading, isError } = useContentPerformance(period);
  const navigate = useNavigate();

  const totalEngagement = posts.reduce((sum, p) => sum + p.engagementScore, 0);
  const totalPosts = posts.length;
  const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;
  const videoPostCount = posts.filter(p => p.mediaType === 'video').length;
  const videoPct = totalPosts > 0 ? Math.round((videoPostCount / totalPosts) * 100) : 0;

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-6xl mx-auto space-y-6">
      <AdminPageHeader
        title="Content Performance"
        description="Top posts ranked by engagement score"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Total Posts" value={totalPosts} icon={FileText} isLoading={isLoading} />
        <AdminKpiCard title="Total Engagement" value={totalEngagement} icon={TrendingUp} iconColor="#F5A623" isLoading={isLoading} />
        <AdminKpiCard title="Avg Engagement/Post" value={avgEngagement} icon={Heart} iconColor="#F31260" isLoading={isLoading} />
        <AdminKpiCard title="Video Posts" value={`${videoPostCount} (${videoPct}%)`} icon={Video} iconColor="#7C3AED" isLoading={isLoading} />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: '#FFFFFF', borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="p-5 pb-3">
          <AdminSectionHeader title="Post Rankings" description="Sorted by engagement score (likes + comments×2.5 + shares×3)" />
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
            <p className="text-[13px]" style={{ color: '#94A3B8' }}>Failed to load content data</p>
          </div>
        ) : !posts.length ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <FileText className="h-8 w-8" style={{ color: '#CBD5E1' }} />
            <p style={{ fontSize: 14, color: '#64748B' }}>No posts found in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B', width: 50 }}>#</th>
                  <th className="text-left px-3 py-3 font-semibold" style={{ color: '#64748B', minWidth: 180 }}>Creator</th>
                  <th className="text-left px-3 py-3 font-semibold" style={{ color: '#64748B', minWidth: 200 }}>Content</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 70 }}>Media</th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 60 }}>
                    <Heart className="w-3.5 h-3.5 mx-auto" />
                  </th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 60 }}>
                    <MessageCircle className="w-3.5 h-3.5 mx-auto" />
                  </th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 60 }}>
                    <Share2 className="w-3.5 h-3.5 mx-auto" />
                  </th>
                  <th className="text-center px-3 py-3 font-semibold" style={{ color: '#64748B', width: 70 }}>Score</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: '#64748B', width: 90 }}>Posted</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => (
                  <tr
                    key={post.postId}
                    onClick={() => navigate(`/profile/${post.userId}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-2.5 font-bold" style={{ color: '#334155', fontSize: 13 }}>
                      {i < 3 ? <span style={{ fontSize: 16 }}>{MEDALS[i]}</span> : i + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <SquircleAvatar size={28} src={post.avatarUrl} alt={post.displayName} />
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: '#334155', fontSize: 12.5 }}>
                            {post.displayName}
                          </p>
                          {post.username && (
                            <p className="truncate" style={{ color: '#94A3B8', fontSize: 11 }}>
                              @{post.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {post.isReview && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
                            style={{ background: '#EFF6FF', color: '#1D6FF5' }}
                          >
                            📍 Review
                          </span>
                        )}
                        <span className="truncate" style={{ color: '#64748B' }}>
                          {post.content?.slice(0, 60) || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      {post.mediaCount > 0 ? (
                        <span className="inline-flex items-center gap-1" style={{ color: '#64748B' }}>
                          {mediaIcon(post.mediaType)}
                          <span style={{ fontSize: 11 }}>{post.mediaCount}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{post.likeCount}</td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{post.commentCount}</td>
                    <td className="text-center px-3 py-2.5" style={{ color: '#334155' }}>{post.shareCount}</td>
                    <td className="text-center px-3 py-2.5">
                      <span className="font-bold" style={{ color: '#F5A623' }}>{post.engagementScore}</span>
                    </td>
                    <td className="text-right px-4 py-2.5 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: 11 }}>
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
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