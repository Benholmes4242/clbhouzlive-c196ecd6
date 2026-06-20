import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, MessageCircle } from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackBusinessProfileVisit } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { BIZ } from '@/components/business/businessTokens';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import HeadlineGrid from '@/components/business/insights/HeadlineGrid';
import ProfileVisitsChart from '@/components/business/insights/ProfileVisitsChart';
import DiscoveryChart from '@/components/business/insights/DiscoveryChart';
import ActionsChart from '@/components/business/insights/ActionsChart';
import ContentPerformanceChart from '@/components/business/insights/ContentPerformanceChart';

type DateRange = '7d' | '30d' | '90d';

const cardStyle: React.CSSProperties = {
  background: BIZ.card,
  border: `1px solid ${BIZ.hair}`,
};

const InsightCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-[18px] p-4 md:p-5" style={cardStyle}>
    <h3 className="text-[0.9rem] font-medium mb-3" style={{ color: BIZ.ink }}>
      {title}
    </h3>
    {children}
  </section>
);

// Reviews section component using real data
const ReviewsSection = ({ businessId, navigate }: { businessId: string; navigate: (path: string) => void }) => {
  const { data: reviewStats, isLoading, error } = useBusinessReviewStats(businessId);

  if (error) {
    return (
      <section className="rounded-[18px] p-4 md:p-5" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
        <h3 className="text-[0.9rem] font-medium text-foreground mb-4">Reviews & reputation</h3>
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Failed to load review stats.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-[18px] p-4 md:p-5" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
        <h3 className="text-[0.9rem] font-medium text-foreground mb-4">Reviews & reputation</h3>
        <div className="space-y-3 px-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!reviewStats) {
    return (
      <section className="rounded-[18px] p-4 md:p-5" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
        <h3 className="text-[0.9rem] font-medium text-foreground mb-4">Reviews & reputation</h3>
        <p className="text-[0.8rem] text-muted-foreground text-center py-6">
          No reviews yet. Once golfers review your courses, you'll see ratings and feedback here.
        </p>
      </section>
    );
  }

  const maxCount = Math.max(...reviewStats.distribution.map(d => d.count), 1);

  return (
    <section className="rounded-[18px] p-4 md:p-5 space-y-5" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
      <h3 className="text-[0.9rem] font-medium text-foreground mb-4">Reviews & reputation</h3>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Rating summary */}
        <div className="text-center md:text-left flex-shrink-0">
          <div className="flex items-baseline gap-1 justify-center md:justify-start">
            <span className="text-[2rem] font-bold text-foreground">{reviewStats.avgRating}</span>
            <span className="text-muted-foreground">/ 10</span>
          </div>
          <p className="text-[0.8rem] text-muted-foreground mt-1">{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</p>
          
          {/* Trend */}
          {reviewStats.recentReviews > 0 && (
            <div className="mt-2 flex items-center gap-1 justify-center md:justify-start">
              <span className={cn("text-xs font-medium", reviewStats.reviewTrend >= 0 ? "" : "text-destructive")} style={reviewStats.reviewTrend >= 0 ? { color: '#F7931E' } : undefined}>
                {reviewStats.recentReviews} new this month
              </span>
              {reviewStats.reviewTrend !== 0 && (
                <span className={cn("text-xs", reviewStats.reviewTrend > 0 ? "" : "text-destructive")} style={reviewStats.reviewTrend > 0 ? { color: '#F7931E' } : undefined}>
                  ({reviewStats.reviewTrend > 0 ? '+' : ''}{reviewStats.reviewTrend}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rating distribution (1-10) */}
        <div className="flex-1 space-y-1">
          {reviewStats.distribution.slice().reverse().map((item) => (
            <div key={item.score} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 text-right">{item.score}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%`, background: '#F7931E' }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-ratings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Design', value: reviewStats.subRatings.design },
          { label: 'Condition', value: reviewStats.subRatings.condition },
          { label: 'Facilities', value: reviewStats.subRatings.facilities },
          { label: 'Clubhouse', value: reviewStats.subRatings.clubhouse },
        ].map(sr => (
          <div key={sr.label} className="rounded-[10px] p-3 text-center" style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.07)' }}>
            <p className="text-lg font-semibold text-foreground">{sr.value ?? '—'}</p>
            <p className="text-[0.7rem] text-muted-foreground">{sr.label}</p>
          </div>
        ))}
      </div>

      {/* Action prompts */}
      <div className="flex flex-col sm:flex-row gap-2">
        {reviewStats.unrespondedCount > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: '#F7931E' }}>
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{reviewStats.unrespondedCount} review{reviewStats.unrespondedCount !== 1 ? 's' : ''} awaiting your response</span>
          </div>
        )}
      </div>

      {/* Multi-course breakdown */}
      {reviewStats.courses.length > 1 && (
        <div className="space-y-2 pt-2" style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          <h4 className="text-[0.8rem] font-medium text-muted-foreground">Course breakdown</h4>
          {reviewStats.courses.map(course => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}?tab=reviews`)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[10px] transition-colors text-left active:scale-[0.98] active:bg-[rgba(15,23,42,0.03)]"
            >
              <div className="min-w-0">
                <p className="text-[0.8rem] font-medium text-foreground truncate">{course.name}</p>
                <p className="text-[0.7rem] text-muted-foreground">
                  {course.reviewCount} review{course.reviewCount !== 1 ? 's' : ''}
                  {course.recentCount > 0 && ` · ${course.recentCount} new`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3" style={{ color: '#F7931E', fill: '#F7931E' }} />
                <span className="text-sm font-medium text-foreground">{course.avgRating}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* View all reviews link */}
      {reviewStats.courses.length > 0 && (
        <button
          onClick={() => navigate(`/courses/${reviewStats.courses[0].id}?tab=reviews`)}
          className="text-[0.8rem] hover:underline"
          style={{ color: '#F7931E' }}
        >
          View all reviews ›
        </button>
      )}
    </section>
  );
};

const BusinessInsightsPageV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { user } = useSupabaseSession();

  useHideBottomNav();
  useHideHeader();
  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading, isFetched: membershipFetched } = useBusinessMembership(id);

  const { daily, headline, isLoading: analyticsLoading } = useBusinessAnalytics(business?.id, dateRange);

  const isLoading = businessLoading || membershipLoading;

  // Track page visit
  useEffect(() => {
    if (business?.id && !isLoading) {
      trackBusinessProfileVisit(business.id, user?.id, 'direct', { page: 'insights' }).catch((err) => {
        AppLog.error('[BusinessInsightsPageV2]', 'Failed to track visit:', err);
      });
    }
  }, [business?.id, user?.id, isLoading]);

  // Access redirect - only after membership has been fetched
  useEffect(() => {
    if (membershipFetched && !membershipLoading && !membership?.canViewInsights && business) {
      navigate(`/business/${id}`, { replace: true });
    }
  }, [membershipFetched, membershipLoading, membership, business, id, navigate]);

  // Loading state
  if (isLoading || !membershipFetched) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="space-y-4 px-4 pt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </PageRoot>
    );
  }

  // Business not found
  if (!business) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p className="text-muted-foreground">Business not found</p>
          <Button onClick={() => navigate('/')} className="mt-4 text-white border-0" style={{ background: BIZ.amber }}>Go home</Button>
        </div>
      </PageRoot>
    );
  }

  // Access check - wait for redirect effect, show loading meanwhile
  if (!membership?.canViewInsights) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="space-y-4 px-4 pt-4">
          <div className="h-32 animate-pulse rounded-2xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
          <div className="h-24 animate-pulse rounded-2xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
        </div>
      </PageRoot>
    );
  }

  const rangeLabels: Record<DateRange, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
  };

  return (
    <PageRoot className="min-h-screen pb-20" style={{ background: BIZ.pageBg }}>
      {/* Title block — CompactHeader provides the back arrow */}
      <div
        className="px-4 pt-3 pb-3"
        style={{ paddingTop: 'calc(var(--chrome-total-h, 0px) + 12px)' }}
      >
        <SectionEyebrow label="INSIGHTS" color="amber" />
        <h1
          className="text-[18px] leading-tight mt-0.5"
          style={{ color: BIZ.ink, fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          Insights
        </h1>
      </div>
      <div
        className="sticky z-10 backdrop-blur-xl"
        style={{
          top: 'var(--chrome-total-h, 0px)',
          background: 'rgba(248,250,252,0.97)',
          borderBottom: `0.5px solid ${BIZ.hair}`,
        }}
      >

        {/* Date range selector */}
        <div className="flex justify-center pb-3">
          <div
            className="inline-flex rounded-full p-1"
            style={{ border: `1px solid ${BIZ.hair}`, background: BIZ.fill }}
          >
            {(['7d', '30d', '90d'] as DateRange[]).map((range) => {
              const active = dateRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'px-3 md:px-4 py-1.5 text-[0.8rem] rounded-full transition-colors',
                    active ? 'font-medium' : '',
                  )}
                  style={
                    active
                      ? { background: BIZ.amber, color: '#ffffff' }
                      : { color: BIZ.inkMute }
                  }
                >
                  {rangeLabels[range]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* Overview — headline metric tiles */}
        <section>
          <h2
            className="text-[0.75rem] font-medium uppercase tracking-wider mb-3"
            style={{ color: BIZ.inkMute }}
          >
            Overview
          </h2>
          <div className="rounded-[18px] p-4 md:p-5" style={cardStyle}>
            <HeadlineGrid headline={headline} isLoading={analyticsLoading} />
          </div>
        </section>

        {/* Traffic over time */}
        <InsightCard title="Profile visits over time">
          {analyticsLoading ? (
            <Skeleton className="h-[200px] w-full rounded-md" />
          ) : (
            <ProfileVisitsChart daily={daily} />
          )}
        </InsightCard>

        {/* How golfers discover you */}
        <InsightCard title="How golfers discover you">
          {analyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <DiscoveryChart headline={headline} />
          )}
        </InsightCard>

        {/* What golfers do next */}
        <InsightCard title="What golfers do next">
          {analyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <ActionsChart headline={headline} />
          )}
        </InsightCard>

        {/* Content performance */}
        <InsightCard title="Content performance">
          {analyticsLoading ? (
            <Skeleton className="h-[220px] w-full rounded-md" />
          ) : (
            <ContentPerformanceChart daily={daily} />
          )}
        </InsightCard>

        {/* Reviews & Reputation — Real Data */}
        <ReviewsSection businessId={business.id} navigate={navigate} />
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPageV2;
