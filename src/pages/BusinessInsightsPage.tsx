import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TrendingUp, ArrowLeft, ShieldAlert, BarChart3 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { insightsEmptyStatesCopy } from '@/lib/insightsEmptyStatesCopy';

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

const BusinessInsightsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessIdFromQuery = searchParams.get('businessId');
  
  const { profile, loading: profileLoading } = useProfileData();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: businessFromQuery, isLoading: businessLoading } = useBusinessProfile(
    businessIdFromQuery || undefined
  );
  
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(
    businessIdFromQuery || undefined
  );

  const isStandaloneBusinessView = !!businessIdFromQuery;

  const isLoading = profileLoading || 
    (isStandaloneBusinessView && (businessLoading || membershipLoading));

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageRoot>
    );
  }

  // Access denied for standalone view without membership
  if (isStandaloneBusinessView && !membership?.canViewInsights) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <div className="bg-card border border-border rounded-[18px] p-8">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">{insightsEmptyStatesCopy.permissionDenied.title}</h1>
            <p className="text-muted-foreground mb-6">
              {insightsEmptyStatesCopy.permissionDenied.body}
            </p>
            {businessFromQuery && (
              <Button 
                onClick={() => navigate(`/business/${businessFromQuery.slug || businessFromQuery.id}`)}
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
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <div className="bg-card border border-border rounded-[18px] p-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">{insightsEmptyStatesCopy.noBusinessProfile.title}</h1>
            <p className="text-muted-foreground mb-6">
              {insightsEmptyStatesCopy.noBusinessProfile.body}
            </p>
            <Button 
              onClick={() => navigate('/business/intro')}
            >
              {insightsEmptyStatesCopy.noBusinessProfile.cta}
            </Button>
          </div>
        </div>
      </PageRoot>
    );
  }

  const rangeLabels: Record<string, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  const businessName = businessFromQuery?.name || profile?.display_name || 'Your Business';
  const businessLogo = businessFromQuery?.logo_url || profile?.profile_photo_url;
  const businessSlug = businessFromQuery?.slug || businessFromQuery?.id;

  return (
    <PageRoot className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto py-6 px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {isStandaloneBusinessView && businessSlug && (
              <Link 
                to={`/business/${businessSlug}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            )}
            
            <div className="flex items-center gap-3">
              {isStandaloneBusinessView && businessFromQuery && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                  {businessLogo && (
                    <SquircleAvatar src={businessLogo} alt={businessName} size={24} />
                  )}
                  <span className="text-sm font-medium text-foreground">{businessName}</span>
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Business Insights</h1>
              <p className="text-muted-foreground">
                See how golfers are discovering and engaging with {isStandaloneBusinessView ? businessName : 'your business'}.
              </p>
            </div>
          </div>

          {/* Range selector */}
          <div className="inline-flex rounded-full border border-border bg-muted p-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  range === r 
                    ? 'bg-primary text-primary-foreground shadow-sm font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>

        {/* All sections — Coming Soon empty states */}
        <div className="space-y-5">
          <section>
            <h2 className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-wider mb-3">Overview</h2>
            <div className="bg-card border border-border rounded-[18px] p-4 md:p-5">
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground text-center">Coming soon — We're building this feature</p>
              </div>
            </div>
          </section>

          <ComingSoonEmpty title="Profile visibility" />
          <ComingSoonEmpty title="Engagement" />
          <ComingSoonEmpty title="Your top posts" />
        </div>
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPage;
