import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessAnalytics, AnalyticsRange } from '@/hooks/useBusinessAnalytics';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Users, 
  ArrowLeft, 
  ShieldAlert,
  Heart,
  AtSign,
  Calendar,
} from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { insightsEmptyStatesCopy } from '@/lib/insightsEmptyStatesCopy';
import { InsightStatCard, InsightChart, InsightActionBreakdown } from '@/components/business/insights';

const BusinessInsightsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessIdFromQuery = searchParams.get('businessId');
  
  const { profile, loading: profileLoading } = useProfileData();
  const [range, setRange] = useState<AnalyticsRange>('30d');

  // If businessId is in query params, fetch that business
  const { data: businessFromQuery, isLoading: businessLoading } = useBusinessProfile(
    businessIdFromQuery || undefined
  );
  
  // Check if current user has access to this business
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(
    businessIdFromQuery || undefined
  );

  // Determine which business ID to use for analytics
  const targetBusinessId = businessIdFromQuery || profile?.id;
  const isStandaloneBusinessView = !!businessIdFromQuery;

  const {
    daily,
    headline,
    isLoading: analyticsLoading,
  } = useBusinessAnalytics(targetBusinessId, range);

  const isLoading = profileLoading || analyticsLoading || 
    (isStandaloneBusinessView && (businessLoading || membershipLoading));

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </PageRoot>
    );
  }

  // Access denied for standalone view without membership
  if (isStandaloneBusinessView && !membership?.canViewInsights) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto mt-section text-center px-4">
          <div className="bg-card border border-border rounded-sq-lg p-8">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-block" />
            <h1 className="text-2xl font-semibold mb-sub">{insightsEmptyStatesCopy.permissionDenied.title}</h1>
            <p className="text-muted-foreground mb-section">
              {insightsEmptyStatesCopy.permissionDenied.body}
            </p>
            {businessFromQuery && (
              <Button 
                onClick={() => navigate(`/business/${businessFromQuery.slug || businessFromQuery.id}`)}
                className="rounded-sq-sm"
              >
                Back to business profile
              </Button>
            )}
          </div>
        </div>
      </PageRoot>
    );
  }

  if (!profile && !isStandaloneBusinessView) {
    return null;
  }

  // Non-business profile trying to access without query param
  if (!isStandaloneBusinessView && profile?.profile_type !== 'business') {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto mt-section text-center px-4">
          <div className="bg-card border border-border rounded-sq-lg p-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-block" />
            <h1 className="text-2xl font-semibold mb-sub">{insightsEmptyStatesCopy.noBusinessProfile.title}</h1>
            <p className="text-muted-foreground mb-section">
              {insightsEmptyStatesCopy.noBusinessProfile.body}
            </p>
            <Button 
              onClick={() => navigate('/business/intro')}
              className="rounded-sq-sm"
            >
              {insightsEmptyStatesCopy.noBusinessProfile.cta}
            </Button>
          </div>
        </div>
      </PageRoot>
    );
  }

  const rangeLabels: Record<AnalyticsRange, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
  };

  const businessName = businessFromQuery?.name || profile?.display_name || 'Your Business';
  const businessLogo = businessFromQuery?.logo_url || profile?.profile_photo_url;
  const businessSlug = businessFromQuery?.slug || businessFromQuery?.id;

  return (
    <PageRoot className="min-h-screen bg-muted/30 pb-24">
      <div className="max-w-6xl mx-auto py-6 px-4 md:px-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {isStandaloneBusinessView && businessSlug && (
              <Link 
                to={`/business/${businessSlug}`}
                className="flex items-center justify-center h-9 w-9 rounded-sq-sm bg-card border border-border hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            
            {isStandaloneBusinessView && businessFromQuery && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-sq-sm bg-card border border-border">
                {businessLogo && (
                  <SquircleAvatar src={businessLogo} alt={businessName} size={28} />
                )}
                <span className="text-sm font-medium">{businessName}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Insights</h1>
              <p className="text-muted-foreground mt-1">
                See how golfers discover and engage with your profile
              </p>
            </div>

            {/* Range selector */}
            <div className="inline-flex rounded-sq-sm border border-border bg-card p-1 self-start md:self-auto">
              {(['7d', '30d', '90d'] as AnalyticsRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-2 text-sm font-medium rounded-sq-xs transition-colors ${
                    range === r 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {rangeLabels[r]}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <InsightStatCard 
            label="Profile views" 
            value={headline.profile_views} 
            icon={Eye}
            subtitle="Total visits"
          />
          <InsightStatCard 
            label="Impressions" 
            value={headline.directory_impressions} 
            icon={Users}
            subtitle="Directory views"
          />
          <InsightStatCard 
            label="Engagements" 
            value={headline.post_engagements} 
            icon={Heart}
            subtitle="Likes & comments"
          />
          <InsightStatCard 
            label="Click-outs" 
            value={headline.click_outs} 
            icon={MousePointerClick}
            subtitle="External actions"
          />
        </section>

        {/* Charts Row */}
        <section className="grid gap-4 lg:grid-cols-2 mb-6">
          <InsightChart
            title="Profile visibility"
            subtitle="Views and impressions over time"
            data={daily}
            lines={[
              { key: 'profile_views', label: 'Profile views' },
              { key: 'directory_impressions', label: 'Impressions' },
            ]}
            variant="area"
          />

          <InsightChart
            title="Engagement"
            subtitle="Post interactions over time"
            data={daily}
            lines={[
              { key: 'post_engagements', label: 'Engagements', color: 'hsl(142 71% 45%)' },
              { key: 'click_outs', label: 'Click-outs', color: 'hsl(38 92% 50%)' },
            ]}
            variant="area"
          />
        </section>

        {/* Action Breakdown + Secondary Stats */}
        <section className="grid gap-4 lg:grid-cols-3 mb-6">
          <InsightActionBreakdown
            callClicks={Math.round(headline.click_outs * 0.2)}
            websiteClicks={Math.round(headline.click_outs * 0.5)}
            directionsClicks={Math.round(headline.click_outs * 0.2)}
            messageClicks={headline.message_clicks}
            className="lg:col-span-2"
          />

          <div className="space-y-4">
            <InsightStatCard 
              label="Messages" 
              value={headline.message_clicks} 
              icon={AtSign}
              subtitle="Conversations started"
            />
            <InsightStatCard 
              label="Mentions" 
              value={headline.mentions} 
              icon={Calendar}
              subtitle="Tagged in posts"
            />
          </div>
        </section>

        {/* Top posts placeholder */}
        <section className="rounded-sq-md border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Top performing posts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your most engaging content this period
          </p>
          <div className="h-32 rounded-sq-sm bg-muted/50 border border-dashed border-border flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        </section>
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPage;
