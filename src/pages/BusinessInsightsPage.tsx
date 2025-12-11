import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessAnalytics, AnalyticsRange, DailyAnalytics } from '@/hooks/useBusinessAnalytics';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Eye, MousePointerClick, MessageSquare, AtSign, TrendingUp, Users, ArrowLeft, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { PageRoot } from '@/components/layout/PageRoot';

const StatCard = ({ 
  label, 
  value, 
  icon: Icon,
  subtitle,
}: { 
  label: string; 
  value: number; 
  icon?: React.ElementType;
  subtitle?: string;
}) => (
  <div className="bg-card border border-border rounded-sq-md p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className="h-10 w-10 rounded-sq-sm bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  </div>
);

interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  data: DailyAnalytics[];
  lines: Array<{ key: string; label: string; color?: string }>;
}

const AnalyticsChart = ({ title, subtitle, data, lines }: AnalyticsChartProps) => {
  const formattedData = data.map((item: DailyAnalytics) => ({
    ...item,
    dayFormatted: format(parseISO(item.day), 'MMM d'),
  }));

  const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  return (
    <div className="bg-card border border-border rounded-sq-md p-4">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-[200px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="dayFormatted" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color ?? colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        )}
      </div>
    </div>
  );
};

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Access denied for standalone view without membership
  if (isStandaloneBusinessView && !membership?.canViewInsights) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center px-4">
        <div className="bg-card border border-border rounded-sq-lg p-8">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have access to insights for this business.
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
    );
  }

  if (!profile && !isStandaloneBusinessView) {
    return null;
  }

  // Non-business profile trying to access without query param - redirect to create business
  if (!isStandaloneBusinessView && profile?.profile_type !== 'business') {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center px-4">
        <div className="bg-card border border-border rounded-sq-lg p-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Business Insights</h1>
          <p className="text-muted-foreground mb-6">
            Create a business profile to unlock analytics and insights about how golfers discover and engage with your business.
          </p>
          <Button 
            onClick={() => navigate('/business/intro')}
            className="rounded-sq-sm"
          >
            Create business profile
          </Button>
        </div>
      </div>
    );
  }

  const rangeLabels: Record<AnalyticsRange, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  const businessName = businessFromQuery?.name || profile?.display_name || 'Your Business';
  const businessLogo = businessFromQuery?.logo_url || profile?.profile_photo_url;
  const businessSlug = businessFromQuery?.slug || businessFromQuery?.id;

  return (
    <PageRoot className="max-w-6xl mx-auto py-8 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          {/* Back link for standalone view */}
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
            {/* Business context pill */}
            {isStandaloneBusinessView && businessFromQuery && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sq-pill bg-muted border border-border">
                {businessLogo && (
                  <SquircleAvatar src={businessLogo} alt={businessName} size={24} />
                )}
                <span className="text-sm font-medium">{businessName}</span>
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-semibold">Business Insights</h1>
            <p className="text-muted-foreground">
              See how golfers are discovering and engaging with {isStandaloneBusinessView ? businessName : 'your business'}.
            </p>
          </div>
        </div>

        {/* Range selector */}
        <div className="inline-flex rounded-sq-pill border border-border bg-muted/50 p-1">
          {(['7d', '30d', '90d'] as AnalyticsRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm rounded-sq-pill transition-colors ${
                range === r 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Headline stats cards */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
        <StatCard 
          label="Profile views" 
          value={headline.profile_views} 
          icon={Eye}
          subtitle="Visits to your profile"
        />
        <StatCard 
          label="Directory impressions" 
          value={headline.directory_impressions} 
          icon={Users}
          subtitle="Seen in business directory"
        />
        <StatCard 
          label="Click-outs" 
          value={headline.click_outs} 
          icon={MousePointerClick}
          subtitle="Website, email & phone clicks"
        />
        <StatCard 
          label="Post engagement" 
          value={headline.post_engagements} 
          icon={TrendingUp}
          subtitle="Likes, comments & shares"
        />
        <StatCard 
          label="Message clicks" 
          value={headline.message_clicks} 
          icon={MessageSquare}
          subtitle="Users messaging you"
        />
        <StatCard 
          label="Mentions" 
          value={headline.mentions} 
          icon={AtSign}
          subtitle="Tagged in posts"
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <AnalyticsChart
          title="Profile visibility"
          subtitle="Profile views vs directory impressions"
          data={daily}
          lines={[
            { key: 'profile_views', label: 'Profile views' },
            { key: 'directory_impressions', label: 'Directory impressions' },
          ]}
        />

        <AnalyticsChart
          title="Engagement"
          subtitle="Click-outs and post engagement"
          data={daily}
          lines={[
            { key: 'click_outs', label: 'Click-outs' },
            { key: 'post_engagements', label: 'Post engagement' },
          ]}
        />
      </section>

      {/* Top posts section – placeholder v1 */}
      <section className="bg-card border border-border rounded-sq-md p-6">
        <h2 className="text-lg font-semibold mb-2">Your top posts</h2>
        <p className="text-sm text-muted-foreground">
          Coming soon: see which posts drive the most engagement for your business.
        </p>
      </section>
    </PageRoot>
  );
};

export default BusinessInsightsPage;
