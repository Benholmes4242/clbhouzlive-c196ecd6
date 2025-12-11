import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Users, MousePointerClick, UserPlus, Phone, Globe, MapPin, MessageSquare, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type DateRange = '7d' | '28d' | '90d';

// Mock data for charts
const MOCK_TRAFFIC_DATA = [
  { day: 'Mon', visits: 42 },
  { day: 'Tue', visits: 58 },
  { day: 'Wed', visits: 35 },
  { day: 'Thu', visits: 72 },
  { day: 'Fri', visits: 65 },
  { day: 'Sat', visits: 89 },
  { day: 'Sun', visits: 121 },
];

const MOCK_DISCOVERY_DATA = [
  { name: 'Search', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Content', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Course pages', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Shares', value: 10, color: 'hsl(var(--chart-4))' },
];

const MOCK_POSTS = [
  { id: '1', thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=120&h=120&fit=crop', caption: 'Perfect conditions at the 18th today...', views: 1240, likes: 89, comments: 12, profileVisits: 34 },
  { id: '2', thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=120&h=120&fit=crop', caption: 'New membership offers available now...', views: 890, likes: 56, comments: 8, profileVisits: 28 },
  { id: '3', thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=120&h=120&fit=crop', caption: 'Weekend tournament recap 🏆', views: 2100, likes: 145, comments: 23, profileVisits: 67 },
];

const MOCK_RATING_DISTRIBUTION = [
  { stars: 5, count: 52, percent: 60 },
  { stars: 4, count: 24, percent: 28 },
  { stars: 3, count: 7, percent: 8 },
  { stars: 2, count: 2, percent: 2 },
  { stars: 1, count: 1, percent: 2 },
];

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  change, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  change: number; 
  icon: React.ElementType;
}) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-card border border-border rounded-sq-md p-4 min-w-[140px] flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="h-9 w-9 rounded-sq-sm bg-muted flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={cn(
          "flex items-center gap-0.5 text-xs font-medium",
          isPositive ? "text-emerald-600" : "text-red-500"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{change}%
        </div>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
};

// Action Card Component
const ActionCard = ({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
}) => (
  <div className="bg-card border border-border rounded-sq-md p-4 text-center">
    <div className="h-10 w-10 rounded-sq-sm bg-muted flex items-center justify-center mx-auto mb-2">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="text-xl font-semibold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

// Post Performance Row
const PostPerformanceRow = ({ post }: { post: typeof MOCK_POSTS[0] }) => (
  <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
    <img 
      src={post.thumbnail} 
      alt="" 
      className="h-14 w-14 rounded-sq-sm object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{post.caption}</p>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span>{post.views.toLocaleString()} views</span>
        <span>{post.likes} likes</span>
        <span>{post.comments} comments</span>
        <span className="text-primary">{post.profileVisits} profile visits</span>
      </div>
    </div>
  </div>
);

const BusinessInsightsPageV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('28d');

  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(id);

  const isLoading = businessLoading || membershipLoading;

  // Loading state
  if (isLoading) {
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

  // Access check - only owners/admins can view insights
  if (!membership?.canViewInsights) {
    navigate(`/business/${id}`, { replace: true });
    return null;
  }

  const rangeLabels: Record<DateRange, string> = {
    '7d': '7 days',
    '28d': '28 days',
    '90d': '90 days',
  };

  return (
    <PageRoot className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/business/${id}`)}
              className="p-2 -ml-2 hover:bg-muted rounded-sq-sm transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold">Insights</h1>
              <p className="text-sm text-muted-foreground truncate">
                {business.name} {business.location && `· ${business.location}`}
              </p>
            </div>
          </div>

          {/* Date range selector */}
          <div className="mt-4 inline-flex rounded-sq-pill border border-border bg-muted/50 p-1">
            {(['7d', '28d', '90d'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-sq-pill transition-colors",
                  dateRange === range 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {rangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics Strip */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Overview</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
            <StatCard label="Profile Visits" value="482" change={18} icon={Eye} />
            <StatCard label="Golfers Reached" value="2.1K" change={9} icon={Users} />
            <StatCard label="Actions Taken" value="137" change={4} icon={MousePointerClick} />
            <StatCard label="New Followers" value="32" change={12} icon={UserPlus} />
          </div>
        </section>

        {/* Traffic Over Time */}
        <section className="bg-card border border-border rounded-sq-md p-4">
          <h3 className="font-semibold mb-1">Profile visits over time</h3>
          <p className="text-sm text-muted-foreground mb-4">Last {rangeLabels[dateRange]}</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
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
                />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVisits)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* How Golfers Discover You */}
        <section className="bg-card border border-border rounded-sq-md p-4">
          <h3 className="font-semibold mb-4">How golfers discover you</h3>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-[160px] w-[160px] mx-auto md:mx-0 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_DISCOVERY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {MOCK_DISCOVERY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {MOCK_DISCOVERY_DATA.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm flex-1">{item.name}</span>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Golfers Do Next */}
        <section>
          <h3 className="font-semibold mb-3">What golfers do next</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionCard label="Call taps" value={24} icon={Phone} />
            <ActionCard label="Website clicks" value={34} icon={Globe} />
            <ActionCard label="Directions" value={18} icon={MapPin} />
            <ActionCard label="Message taps" value={61} icon={MessageSquare} />
          </div>
        </section>

        {/* Content Performance */}
        <section className="bg-card border border-border rounded-sq-md p-4">
          <h3 className="font-semibold mb-1">Content performance</h3>
          <p className="text-sm text-muted-foreground mb-3">Your top performing posts</p>
          <div>
            {MOCK_POSTS.map(post => (
              <PostPerformanceRow key={post.id} post={post} />
            ))}
          </div>
        </section>

        {/* Reviews & Reputation */}
        <section className="bg-card border border-border rounded-sq-md p-4">
          <h3 className="font-semibold mb-4">Reviews & reputation</h3>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Rating summary */}
            <div className="text-center md:text-left">
              <div className="flex items-baseline gap-1 justify-center md:justify-start">
                <span className="text-4xl font-bold">4.7</span>
                <span className="text-muted-foreground">/ 5</span>
              </div>
              <div className="flex items-center gap-1 justify-center md:justify-start mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={cn(
                      "h-4 w-4",
                      star <= 4 ? "text-amber-400 fill-amber-400" : "text-amber-400 fill-amber-400/50"
                    )} 
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">86 reviews</p>
            </div>

            {/* Rating distribution */}
            <div className="flex-1 space-y-1.5">
              {MOCK_RATING_DISTRIBUTION.map((item) => (
                <div key={item.stars} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{item.stars}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPageV2;
