import React, { useState } from 'react';
import { FileText, Star, TrendingUp, MessageSquare } from 'lucide-react';
import { useContentAnalytics, type AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import {
  AdminPageHeader, AdminKpiCard, AdminSectionHeader, AdminPeriodPicker,
} from '../../components/ui';
import {
  DualAreaChart, ChartSkeleton,
} from '../../components/shared/AdminAreaChart';

export default function ContentAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('14d');
  const { data, isLoading } = useContentAnalytics(period);

  const combined = (data?.postsTrend ?? []).map((p, i) => ({
    date:    p.date,
    posts:   p.value,
    reviews: data?.reviewsTrend?.[i]?.value ?? 0,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

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

      {/* Posts + Reviews trend */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Posts vs Reviews" />
        <div className="min-h-[200px]">
          {isLoading
            ? <ChartSkeleton height={200} />
            : <DualAreaChart
                data={combined}
                series={[
                  { key: 'posts',   name: 'Posts',   color: '#3b82f6' },
                  { key: 'reviews', name: 'Reviews', color: 'hsl(var(--accent-amber))' },
                ]}
              />
          }
        </div>
      </div>

      {/* Top reviewed courses */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <AdminSectionHeader title="Top Reviewed Courses" />
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-40 bg-muted rounded-md" />
                    <div className="h-3 w-24 bg-muted rounded-md" />
                  </div>
                  <div className="h-4 w-12 bg-muted rounded-md" />
                </div>
              ))}
            </div>
          ) : !data?.topReviewedCourses?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No review data yet
            </p>
          ) : (
            <div className="space-y-2">
              {data.topReviewedCourses.map((course, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[12px] font-bold text-muted-foreground flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{course.name}</p>
                    <p className="text-[11px] text-muted-foreground">{course.country}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-semibold text-foreground">{course.count}</p>
                    {course.avgRating > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        ★ {course.avgRating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
