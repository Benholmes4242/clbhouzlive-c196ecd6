import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Star, MessageCircle } from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackBusinessProfileVisit } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

type DateRange = '7d' | '28d' | '90d';

/** Placeholder empty state for sections not yet wired to real data */
const ComingSoonEmpty = ({ title }: { title: string }) => (
  <section className="bg-card border border-border rounded-[18px] p-4 md:p-5">
    <h3 className="text-[0.9rem] font-medium text-foreground mb-1">{title}</h3>
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground text-center">Coming soon — We're building this feature</p>
    </div>
  </section>
);

// Reviews section component using real data
const ReviewsSection = ({ businessId, navigate }: { businessId: string; navigate: (path: string) => void }) => {
  const { data: reviewStats, isLoading } = useBusinessReviewStats(businessId);

  if (isLoading) {
    return (
      <section className="bg-card border border-border rounded-[18px] p-4 md:p-5">
        <h3 className="text-[0.9rem] font-medium text-foreground mb-4">Reviews & reputation</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      </section>
    );
  }

  if (!reviewStats) {
    return (
      <section className="bg-card border border-border rounded-[18px] p-4 md:p-5">
        <h3 className="text-[0.9rem] font-medium text-foreground mb-4">Reviews & reputation</h3>
        <p className="text-[0.8rem] text-muted-foreground text-center py-6">
          No reviews yet. Once golfers review your courses, you'll see ratings and feedback here.
        </p>
      </section>
    );
  }

  const maxCount = Math.max(...reviewStats.distribution.map(d => d.count), 1);

  return (
    <section className="bg-card border border-border rounded-[18px] p-4 md:p-5 space-y-5">
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
              <span className={cn(
                "text-xs font-medium",
                reviewStats.reviewTrend >= 0 ? "text-emerald-600" : "text-red-500"
              )}>
                {reviewStats.recentReviews} new this month
              </span>
              {reviewStats.reviewTrend !== 0 && (
                <span className={cn(
                  "text-xs",
                  reviewStats.reviewTrend > 0 ? "text-emerald-600" : "text-red-500"
                )}>
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
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%`, backgroundColor: '#f59e0b' }}
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
          <div key={sr.label} className="rounded-[10px] bg-muted border border-border p-3 text-center">
            <p className="text-lg font-semibold text-foreground">{sr.value ?? '—'}</p>
            <p className="text-[0.7rem] text-muted-foreground">{sr.label}</p>
          </div>
        ))}
      </div>

      {/* Action prompts */}
      <div className="flex flex-col sm:flex-row gap-2">
        {reviewStats.unrespondedCount > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: '#f59e0b' }}>
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{reviewStats.unrespondedCount} review{reviewStats.unrespondedCount !== 1 ? 's' : ''} awaiting your response</span>
          </div>
        )}
      </div>

      {/* Multi-course breakdown */}
      {reviewStats.courses.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-[0.8rem] font-medium text-muted-foreground">Course breakdown</h4>
          {reviewStats.courses.map(course => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}?tab=reviews`)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[10px] hover:bg-muted transition-colors text-left active:scale-[0.98]"
            >
              <div className="min-w-0">
                <p className="text-[0.8rem] font-medium text-foreground truncate">{course.name}</p>
                <p className="text-[0.7rem] text-muted-foreground">
                  {course.reviewCount} review{course.reviewCount !== 1 ? 's' : ''}
                  {course.recentCount > 0 && ` · ${course.recentCount} new`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
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
          style={{ color: '#f59e0b' }}
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
  const [dateRange, setDateRange] = useState<DateRange>('28d');
  const { user } = useSupabaseSession();

  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading, isFetched: membershipFetched } = useBusinessMembership(id);

  const isLoading = businessLoading || membershipLoading;

  // Track page visit
  useEffect(() => {
    if (business?.id && !isLoading) {
      trackBusinessProfileVisit(business.id, user?.id, 'direct', { page: 'insights' });
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
          <Button onClick={() => navigate('/')} className="mt-4">Go home</Button>
        </div>
      </PageRoot>
    );
  }

  // Access check - wait for redirect effect, show loading meanwhile
  if (!membership?.canViewInsights) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageRoot>
    );
  }

  const rangeLabels: Record<DateRange, string> = {
    '7d': '7 days',
    '28d': '28 days',
    '90d': '90 days',
  };

  return (
    <PageRoot className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/business/${id}`)}
                className="p-2 -ml-2 hover:bg-muted rounded-[10px] transition-colors active:scale-[0.97]"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground">Insights</h1>
                <p className="text-[0.8rem] text-muted-foreground truncate">
                  {business.name} {business.location && `· ${business.location.split(',')[0]}`}
                </p>
              </div>
            </div>

            {/* Date range selector */}
            <div className="inline-flex rounded-full border border-border bg-muted p-1">
              {(['7d', '28d', '90d'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-3 md:px-4 py-1.5 text-[0.8rem] rounded-full transition-colors",
                    dateRange === range 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {rangeLabels[range]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* Key Metrics Strip — Coming Soon */}
        <section>
          <h2 className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-wider mb-3">Overview</h2>
          <div className="bg-card border border-border rounded-[18px] p-4 md:p-5">
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">Coming soon — We're building this feature</p>
            </div>
          </div>
        </section>

        {/* Traffic Over Time — Coming Soon */}
        <ComingSoonEmpty title="Profile visits over time" />

        {/* How Golfers Discover You — Coming Soon */}
        <ComingSoonEmpty title="How golfers discover you" />

        {/* What Golfers Do Next — Coming Soon */}
        <ComingSoonEmpty title="What golfers do next" />

        {/* Content Performance — Coming Soon */}
        <ComingSoonEmpty title="Content performance" />

        {/* Reviews & Reputation — Real Data */}
        <ReviewsSection businessId={business.id} navigate={navigate} />
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPageV2;
