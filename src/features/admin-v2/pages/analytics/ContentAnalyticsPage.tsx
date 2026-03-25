import React, { useState } from 'react';
import { FileText, Star, TrendingUp, MessageSquare } from 'lucide-react';
import { useContentAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import { ChartSkeleton } from '../../components/shared/AdminAreaChart';
import { AdminBarChart } from '../../components/shared/AdminBarChart';
import { AdminDonutChart } from '../../components/shared/AdminDonutChart';
import { AdminStatRow } from '../../components/shared/AdminStatRow';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Fetch content mix (posts by type)
async function fetchContentMix() {
  const { data: posts } = await supabase
    .from('posts')
    .select('id, source_review_id')
    .limit(5000);

  const { data: media } = await supabase
    .from('post_media')
    .select('post_id, media_type')
    .limit(5000);

  const allPosts = posts ?? [];
  const mediaMap = new Map<string, string>();
  for (const m of media ?? []) {
    if (!mediaMap.has(m.post_id)) {
      mediaMap.set(m.post_id, m.media_type);
    }
  }

  let videoCount = 0;
  let imageCount = 0;
  let reviewCount = 0;
  let textCount = 0;

  for (const p of allPosts) {
    if (p.source_review_id) {
      reviewCount++;
    } else {
      const mType = mediaMap.get(p.id);
      if (mType === 'video') videoCount++;
      else if (mType === 'image') imageCount++;
      else textCount++;
    }
  }

  return { videoCount, imageCount, reviewCount, textCount, total: allPosts.length };
}

export default function ContentAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useContentAnalytics(period);
  const { data: contentMix, isLoading: mixLoading } = useQuery({
    queryKey: ['admin-v2', 'content-mix'],
    queryFn: fetchContentMix,
    staleTime: 10 * 60_000,
  });

  // Side-by-side bar data
  const barData = (data?.postsTrend ?? []).map((p, i) => ({
    label: p.date,
    value: p.value,
    color: '#1D6FF5',
  }));

  // Top course's max count for bar %
  const maxCourseCount = (data?.topReviewedCourses ?? [])[0]?.count ?? 1;

  // Content mix donut
  const mixColors = { video: '#F5A623', image: '#1D6FF5', review: '#17C964', text: '#94A3B8' };
  const donutData = contentMix ? [
    { label: 'Video', value: contentMix.videoCount, color: mixColors.video },
    { label: 'Image', value: contentMix.imageCount, color: mixColors.image },
    { label: 'Review', value: contentMix.reviewCount, color: mixColors.review },
    { label: 'Text', value: contentMix.textCount, color: mixColors.text },
  ].filter(d => d.value > 0) : [];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">

      <AdminPageHeader
        title="Content Analytics"
        description="Posts, reviews, and community engagement"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Total Posts"        value={data?.totalPosts ?? 0}         icon={FileText}     isLoading={isLoading} />
        <AdminKpiCard title="Posts This Period"  value={data?.postsThisPeriod ?? 0}    icon={TrendingUp}   iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Total Reviews"      value={data?.totalReviews ?? 0}       icon={Star}         iconColor="hsl(var(--accent-amber))" isLoading={isLoading} />
        <AdminKpiCard title="Reviews This Period" value={data?.reviewsThisPeriod ?? 0} icon={MessageSquare} iconColor="#22c55e" isLoading={isLoading} />
      </div>

      {/* Posts bar chart */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Daily Posts" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <AdminBarChart data={barData} color="#1D6FF5" height={200} />
          }
        </div>
      </div>

      {/* Content Mix donut */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Content Mix" />
        {mixLoading ? (
          <ChartSkeleton height={160} />
        ) : !donutData.length ? (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '32px 0' }}>No content data</p>
        ) : (
          <div className="flex items-center gap-8 flex-wrap">
            <AdminDonutChart
              data={donutData}
              size={160}
              innerRadius={48}
              centerValue={contentMix?.total ?? 0}
              centerLabel="Total"
            />
            <div className="flex-1 min-w-[140px] space-y-2">
              {donutData.map(d => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top reviewed courses with stat rows */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} className="space-y-4">
        <AdminSectionHeader title="Top Reviewed Courses" />
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded" style={{ background: '#F1F5F9' }} />)}
          </div>
        ) : !data?.topReviewedCourses?.length ? (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '32px 0' }}>
            No review data yet
          </p>
        ) : (
          <div>
            {data.topReviewedCourses.map((course, i) => (
              <AdminStatRow
                key={i}
                label={`${course.name}${course.country ? ` · ${course.country}` : ''}`}
                value={course.count}
                subValue={course.avgRating > 0 ? `★ ${course.avgRating.toFixed(1)}` : undefined}
                barPct={(course.count / maxCourseCount) * 100}
                color="#F5A623"
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
